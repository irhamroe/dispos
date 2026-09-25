import React, { useState, useEffect } from 'react';
import { 
  initialSchoolProfile, 
  initialClasses, 
  initialStudents, 
  generateInitialAttendance, 
  initialDisciplineRecords,
  initialWaliKelas,
  defaultAdminUser,
  sampleViolationCatalog,
  initialUsers,
  RombelClass
} from './data/initialData';
import { AdminUser, AttendanceRecord, DisciplineRecord, Student, DisciplineStatus, WaliKelasTeacher, ViolationRule } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { DailyAttendanceView } from './components/DailyAttendanceView';
import { RecapAttendanceView } from './components/RecapAttendanceView';
import { PermissionLetterRecapView } from './components/PermissionLetterRecapView';
import { DisciplineView } from './components/DisciplineView';
import { DisciplineRecapView } from './components/DisciplineRecapView';
import { DisciplineDebtView } from './components/DisciplineDebtView';
import { ViolationRulesView } from './components/ViolationRulesView';
import { ParentCallLetterView } from './components/ParentCallLetterView';
import { StudentMasterView } from './components/StudentMasterView';
import { DataKelasView } from './components/DataKelasView';
import { DataWaliKelasView } from './components/DataWaliKelasView';
import { UserManagementView } from './components/UserManagementView';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { isFirebaseConfigured } from './services/firebase';
import {
  fetchAllDocuments,
  subscribeToCollection,
  batchSaveDocuments,
  saveDocument,
  deleteDocument,
  saveAttendanceBatch,
  saveStudent,
  saveDisciplineRecord,
  deleteDisciplineRecord as deleteDisciplineFromDb,
  COLLECTIONS
} from './services/firestoreService';
import { getTodayIndonesian, getTodayDateString } from './utils/exportUtils';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('app_sman1batu_admin_user');
      return saved ? JSON.parse(saved) : defaultAdminUser;
    } catch {
      return defaultAdminUser;
    }
  });

  // Classes state (36 Rombel X-1 to XII-12)
  const [classes, setClasses] = useState<RombelClass[]>(() => {
    try {
      const saved = localStorage.getItem('app_sman1batu_classes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 36) return parsed;
      }
      return initialClasses;
    } catch {
      return initialClasses;
    }
  });

  // Wali Kelas state (36 Teachers)
  const [waliKelasList, setWaliKelasList] = useState<WaliKelasTeacher[]>(() => {
    try {
      const saved = localStorage.getItem('app_sman1batu_walikelas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 36) return parsed;
      }
      return initialWaliKelas;
    } catch {
      return initialWaliKelas;
    }
  });

  // Students state (36 Rombel, ~1,300 students)
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('app_sman1batu_students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 500) return parsed;
      }
      return initialStudents;
    } catch {
      return initialStudents;
    }
  });

  // Attendance Records state (H, I, S, A, D)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('app_sman1batu_attendance');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 500) return parsed;
      }
      return generateInitialAttendance(initialStudents);
    } catch {
      return generateInitialAttendance(initialStudents);
    }
  });

  // Discipline Records state
  const [disciplineRecords, setDisciplineRecords] = useState<DisciplineRecord[]>(() => {
    try {
      const saved = localStorage.getItem('app_sman1batu_discipline');
      return saved ? JSON.parse(saved) : initialDisciplineRecords;
    } catch {
      return initialDisciplineRecords;
    }
  });

  // Violation Rules Catalog state
  const [violationRules, setViolationRules] = useState<ViolationRule[]>(() => {
    try {
      const saved = localStorage.getItem('app_sman1batu_violation_rules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return sampleViolationCatalog;
    } catch {
      return sampleViolationCatalog;
    }
  });

  // Users state (Multi-Role: Admin, Wali Kelas, Guru, Tendik)
  const [users, setUsers] = useState<AdminUser[]>(() => {
    try {
      const saved = localStorage.getItem('app_sman1batu_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return initialUsers;
    } catch {
      return initialUsers;
    }
  });

  // Navigation and view states
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [selectedClassForStudentView, setSelectedClassForStudentView] = useState<string | undefined>(undefined);

  // Firebase connection & modal states
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(() => isFirebaseConfigured());

  // Real-time Cloud Firestore Subscriptions & Auto-Sync (Instant cross-device sync between HP & Laptop)
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setIsFirebaseConnected(false);
      return;
    }

    setIsFirebaseConnected(true);

    // Initial check: if Firestore is clean/empty, seed initial master data
    const checkAndSeedOnline = async () => {
      try {
        const [remoteStudents, remoteClasses, remoteWali, remoteRules, remoteUsers] = await Promise.all([
          fetchAllDocuments<Student>(COLLECTIONS.STUDENTS),
          fetchAllDocuments<RombelClass>(COLLECTIONS.CLASSES),
          fetchAllDocuments<WaliKelasTeacher>(COLLECTIONS.WALI_KELAS),
          fetchAllDocuments<ViolationRule>(COLLECTIONS.VIOLATION_RULES),
          fetchAllDocuments<AdminUser>(COLLECTIONS.USERS),
        ]);

        if (remoteStudents.length === 0) {
          batchSaveDocuments(COLLECTIONS.STUDENTS, initialStudents).catch(() => {});
        }
        if (remoteClasses.length === 0) {
          batchSaveDocuments(COLLECTIONS.CLASSES, initialClasses).catch(() => {});
        }
        if (remoteWali.length === 0) {
          batchSaveDocuments(COLLECTIONS.WALI_KELAS, initialWaliKelas).catch(() => {});
        }
        if (remoteRules.length === 0) {
          batchSaveDocuments(COLLECTIONS.VIOLATION_RULES, sampleViolationCatalog).catch(() => {});
        }
        if (remoteUsers.length === 0) {
          batchSaveDocuments(COLLECTIONS.USERS, initialUsers).catch(() => {});
        }
      } catch (e) {
        console.warn('Auto-seed check failed:', e);
      }
    };

    checkAndSeedOnline();

    // 1. Realtime Students subscription (HP <-> Laptop sync)
    const unsubStudents = subscribeToCollection<Student>(COLLECTIONS.STUDENTS, (data) => {
      if (data && data.length > 0) {
        setStudents(data);
      }
    });

    // 2. Realtime Classes subscription
    const unsubClasses = subscribeToCollection<RombelClass>(COLLECTIONS.CLASSES, (data) => {
      if (data && data.length > 0) {
        setClasses(data);
      }
    });

    // 3. Realtime Wali Kelas subscription
    const unsubWali = subscribeToCollection<WaliKelasTeacher>(COLLECTIONS.WALI_KELAS, (data) => {
      if (data && data.length > 0) {
        setWaliKelasList(data);
      }
    });

    // 4. Realtime Attendance subscription (Instant live attendance sync)
    const unsubAttendance = subscribeToCollection<AttendanceRecord>(COLLECTIONS.ATTENDANCE, (data) => {
      if (data && data.length > 0) {
        setAttendanceRecords(data);
      }
    });

    // 5. Realtime Discipline & Pelanggaran subscription
    const unsubDiscipline = subscribeToCollection<DisciplineRecord>(COLLECTIONS.DISCIPLINE, (data) => {
      if (data) {
        setDisciplineRecords(data);
      }
    });

    // 6. Realtime Violation Rules subscription
    const unsubRules = subscribeToCollection<ViolationRule>(COLLECTIONS.VIOLATION_RULES, (data) => {
      if (data && data.length > 0) {
        setViolationRules(data);
      }
    });

    // 7. Realtime Users subscription
    const unsubUsers = subscribeToCollection<AdminUser>(COLLECTIONS.USERS, (data) => {
      if (data && data.length > 0) {
        setUsers(data);
      }
    });

    return () => {
      if (unsubStudents) unsubStudents();
      if (unsubClasses) unsubClasses();
      if (unsubWali) unsubWali();
      if (unsubAttendance) unsubAttendance();
      if (unsubDiscipline) unsubDiscipline();
      if (unsubRules) unsubRules();
      if (unsubUsers) unsubUsers();
    };
  }, []);

  // Tab navigation handler with real-time date sync for attendance
  const handleSelectTab = (tab: NavTab) => {
    if (tab === 'attendance') {
      setSelectedDate(getTodayDateString());
    }
    setCurrentTab(tab);
  };

  // Cross-view quick action states (e.g. going from attendance to discipline modal)
  const [initialStudentForDisc, setInitialStudentForDisc] = useState<Student | null>(null);
  const [initialViolationForDisc, setInitialViolationForDisc] = useState<string>('');

  // Persist state to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('app_sman1batu_admin_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('app_sman1batu_admin_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('app_sman1batu_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('app_sman1batu_walikelas', JSON.stringify(waliKelasList));
  }, [waliKelasList]);

  useEffect(() => {
    localStorage.setItem('app_sman1batu_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('app_sman1batu_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('app_sman1batu_discipline', JSON.stringify(disciplineRecords));
  }, [disciplineRecords]);

  useEffect(() => {
    localStorage.setItem('app_sman1batu_violation_rules', JSON.stringify(violationRules));
  }, [violationRules]);

  useEffect(() => {
    localStorage.setItem('app_sman1batu_users', JSON.stringify(users));
  }, [users]);

  // Login handler
  const handleLoginSuccess = (user: AdminUser) => {
    setCurrentUser(user);
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
  };

  // User Management handlers (Multi-Role: Admin, Wali Kelas, Guru, Tendik)
  const handleAddUser = (newUser: AdminUser) => {
    setUsers((prev) => [newUser, ...prev]);
    saveDocument(COLLECTIONS.USERS, newUser).catch(() => {});
  };

  const handleUpdateUser = (updated: AdminUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    saveDocument(COLLECTIONS.USERS, updated).catch(() => {});
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteDocument(COLLECTIONS.USERS, userId).catch(() => {});
  };

  const handleSwitchUser = (targetUser: AdminUser) => {
    setCurrentUser(targetUser);
  };

  // Violation Rules management handlers
  const handleAddViolationRule = (newRule: ViolationRule) => {
    setViolationRules((prev) => [newRule, ...prev]);
    saveDocument(COLLECTIONS.VIOLATION_RULES, newRule).catch(() => {});
  };

  const handleEditViolationRule = (updated: ViolationRule) => {
    setViolationRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    saveDocument(COLLECTIONS.VIOLATION_RULES, updated).catch(() => {});
  };

  const handleDeleteViolationRule = (ruleId: string) => {
    setViolationRules((prev) => prev.filter((r) => r.id !== ruleId));
    deleteDocument(COLLECTIONS.VIOLATION_RULES, ruleId).catch(() => {});
  };

  const handleResetViolationRules = () => {
    setViolationRules(sampleViolationCatalog);
  };

  // Class management handlers
  const handleUpdateClass = (updated: RombelClass) => {
    setClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    saveDocument(COLLECTIONS.CLASSES, updated).catch(() => {});
    setWaliKelasList((prev) =>
      prev.map((w) => (w.className === updated.name ? { ...w, name: updated.homeroom } : w))
    );
  };

  const handleAddClass = (newClass: RombelClass) => {
    setClasses((prev) => [...prev, newClass]);
    saveDocument(COLLECTIONS.CLASSES, newClass).catch(() => {});
  };

  const handleDeleteClass = (classId: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== classId));
    deleteDocument(COLLECTIONS.CLASSES, classId).catch(() => {});
  };

  // Wali Kelas management handlers
  const handleUpdateWaliKelas = (updated: WaliKelasTeacher) => {
    setWaliKelasList((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    saveDocument(COLLECTIONS.WALI_KELAS, updated).catch(() => {});
    setClasses((prev) =>
      prev.map((c) => (c.name === updated.className ? { ...c, homeroom: updated.name } : c))
    );
  };

  const handleAddWaliKelas = (newTeacher: WaliKelasTeacher) => {
    setWaliKelasList((prev) => [...prev, newTeacher]);
    saveDocument(COLLECTIONS.WALI_KELAS, newTeacher).catch(() => {});
  };

  const handleDeleteWaliKelas = (teacherId: string) => {
    setWaliKelasList((prev) => prev.filter((w) => w.id !== teacherId));
    deleteDocument(COLLECTIONS.WALI_KELAS, teacherId).catch(() => {});
  };

  // Navigate to Data Siswa with pre-filtered class
  const handleViewClassStudents = (className: string) => {
    setSelectedClassForStudentView(className);
    setCurrentTab('data-siswa');
  };

  // Save / Update Attendance records
  const handleSaveAttendance = (updatedRecords: AttendanceRecord[]) => {
    setAttendanceRecords((prev) => {
      const updatedMap = new Map(prev.map((r) => [r.id, r]));
      updatedRecords.forEach((r) => {
        updatedMap.set(r.id, r);
      });
      return Array.from(updatedMap.values());
    });
    // Sync to Firestore in background
    saveAttendanceBatch(updatedRecords).catch((e) => {
      console.warn('Background attendance sync to Firestore failed:', e);
    });
  };

  // Add new discipline record
  const handleAddDisciplineRecord = (newRecord: DisciplineRecord) => {
    setDisciplineRecords((prev) => [newRecord, ...prev]);
    saveDisciplineRecord(newRecord).catch(() => {});
  };

  // Update discipline record status
  const handleUpdateDisciplineStatus = (id: string, status: DisciplineStatus) => {
    setDisciplineRecords((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, status } : r));
      const target = updated.find((r) => r.id === id);
      if (target) saveDisciplineRecord(target).catch(() => {});
      return updated;
    });
  };

  // Update full discipline record (including coaching)
  const handleUpdateDisciplineRecord = (updatedRecord: DisciplineRecord) => {
    setDisciplineRecords((prev) =>
      prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    );
    saveDisciplineRecord(updatedRecord).catch(() => {});
  };

  // Delete discipline record
  const handleDeleteDisciplineRecord = (id: string) => {
    setDisciplineRecords((prev) => prev.filter((r) => r.id !== id));
    deleteDisciplineFromDb(id).catch(() => {});
  };

  // Add new student
  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [...prev, newStudent]);
    saveStudent(newStudent).catch(() => {});
  };

  // Update existing student
  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
    saveStudent(updatedStudent).catch(() => {});
  };

  // Delete student
  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    deleteDocument(COLLECTIONS.STUDENTS, studentId).catch(() => {});
  };

  // Quick jump from attendance to discipline
  const handleOpenQuickDiscipline = (student: Student, defaultViolation: string) => {
    setInitialStudentForDisc(student);
    setInitialViolationForDisc(defaultViolation);
    setCurrentTab('discipline');
  };

  // If not logged in, display the secure login screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        schoolProfile={initialSchoolProfile}
        users={users}
      />
    );
  }

  // Calculate today stats for sidebar (H = Hadir, D = Dispen, A = Alpa)
  const todayRecords = attendanceRecords.filter((r) => r.date === selectedDate);
  const todayHadir = todayRecords.filter((r) => r.status === 'H' || r.status === 'D').length;
  const todayAlpa = todayRecords.filter((r) => r.status === 'A').length;

  // Calculate pending coaching debts (either coaching not done or letter document missing)
  const totalPendingDebt = disciplineRecords.filter(
    (r) => r.coachingStatus !== 'Sudah' || !r.coachingEvidenceFile
  ).length;

  // Calculate pending permission / sick letters (students with I or S who have not submitted physical letters)
  const totalPendingLetters = attendanceRecords.filter(
    (r) => (r.status === 'I' || r.status === 'S') && r.hasLetter !== 'Sudah Ada Surat'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        schoolProfile={initialSchoolProfile}
        onLogout={handleLogout}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        todayStr={getTodayIndonesian()}
        isFirebaseConnected={isFirebaseConnected}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
      />

      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          todayCount={{
            total: students.length,
            hadir: todayHadir,
            alpa: todayAlpa,
          }}
          totalDisciplineCases={disciplineRecords.length}
          totalPendingDebt={totalPendingDebt}
          totalPendingLetters={totalPendingLetters}
          totalUsers={users.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-72 pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              students={students}
              attendanceRecords={attendanceRecords}
              disciplineRecords={disciplineRecords}
              classes={classes}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onNavigateTab={handleSelectTab}
            />
          )}

          {currentTab === 'attendance' && (
            <DailyAttendanceView
              students={students}
              attendanceRecords={attendanceRecords}
              classes={classes}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onSaveAttendance={handleSaveAttendance}
              onOpenQuickDiscipline={handleOpenQuickDiscipline}
              currentUserName={currentUser.name}
            />
          )}

          {currentTab === 'recap' && (
            <RecapAttendanceView
              students={students}
              attendanceRecords={attendanceRecords}
              classes={classes}
              schoolProfile={initialSchoolProfile}
            />
          )}

          {currentTab === 'rekap-surat-izin' && (
            <PermissionLetterRecapView
              students={students}
              attendanceRecords={attendanceRecords}
              classes={classes}
              schoolProfile={initialSchoolProfile}
              onUpdateAttendance={handleSaveAttendance}
            />
          )}

          {currentTab === 'discipline' && (
            <DisciplineView
              students={students}
              disciplineRecords={disciplineRecords}
              onAddRecord={handleAddDisciplineRecord}
              onUpdateStatus={handleUpdateDisciplineStatus}
              onUpdateRecord={handleUpdateDisciplineRecord}
              onDeleteRecord={handleDeleteDisciplineRecord}
              schoolProfile={initialSchoolProfile}
              currentUserName={currentUser.name}
              initialStudentForModal={initialStudentForDisc}
              initialViolationForModal={initialViolationForDisc}
              onClearInitialModalData={() => {
                setInitialStudentForDisc(null);
                setInitialViolationForDisc('');
              }}
              violationRules={violationRules}
            />
          )}

          {currentTab === 'rekap-pelanggaran' && (
            <DisciplineRecapView
              disciplineRecords={disciplineRecords}
              students={students}
              schoolProfile={initialSchoolProfile}
            />
          )}

          {currentTab === 'tagihan-pembinaan' && (
            <DisciplineDebtView
              disciplineRecords={disciplineRecords}
              students={students}
              schoolProfile={initialSchoolProfile}
              onUpdateRecord={handleUpdateDisciplineRecord}
              currentUserName={currentUser.name}
            />
          )}

          {currentTab === 'surat-panggilan' && (
            <ParentCallLetterView
              students={students}
              disciplineRecords={disciplineRecords}
              classes={classes}
              waliKelasList={waliKelasList}
              schoolProfile={initialSchoolProfile}
              currentUserName={currentUser.name}
            />
          )}

          {currentTab === 'aturan-pelanggaran' && (
            <ViolationRulesView
              violationRules={violationRules}
              onAddRule={handleAddViolationRule}
              onEditRule={handleEditViolationRule}
              onDeleteRule={handleDeleteViolationRule}
              onResetRules={handleResetViolationRules}
            />
          )}

          {(currentTab === 'students' || currentTab === 'data-siswa') && (
            <StudentMasterView
              students={students}
              classes={classes}
              disciplineRecords={disciplineRecords}
              attendanceRecords={attendanceRecords}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              initialClassFilter={selectedClassForStudentView}
            />
          )}

          {currentTab === 'data-kelas' && (
            <DataKelasView
              classes={classes}
              students={students}
              onUpdateClass={handleUpdateClass}
              onAddClass={handleAddClass}
              onDeleteClass={handleDeleteClass}
              onViewClassStudents={handleViewClassStudents}
            />
          )}

          {currentTab === 'data-walikelas' && (
            <DataWaliKelasView
              waliKelasList={waliKelasList}
              classes={classes}
              students={students}
              onUpdateWaliKelas={handleUpdateWaliKelas}
              onAddWaliKelas={handleAddWaliKelas}
              onDeleteWaliKelas={handleDeleteWaliKelas}
              onViewClassStudents={handleViewClassStudents}
            />
          )}

          {currentTab === 'manajemen-user' && (
            <UserManagementView
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onSwitchUser={handleSwitchUser}
              currentUser={currentUser}
              classes={classes}
            />
          )}
        </main>
      </div>

      {/* Firebase Cloud Firestore Modal */}
      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => {
          setIsFirebaseModalOpen(false);
          setIsFirebaseConnected(isFirebaseConfigured());
        }}
        students={students}
        classes={classes}
        waliKelasList={waliKelasList}
        attendanceRecords={attendanceRecords}
        disciplineRecords={disciplineRecords}
        violationRules={violationRules}
        users={users}
        onDataSynced={(synced) => {
          if (synced.students) setStudents(synced.students);
          if (synced.classes) setClasses(synced.classes);
          if (synced.waliKelasList) setWaliKelasList(synced.waliKelasList);
          if (synced.attendanceRecords) setAttendanceRecords(synced.attendanceRecords);
          if (synced.disciplineRecords) setDisciplineRecords(synced.disciplineRecords);
          if (synced.violationRules) setViolationRules(synced.violationRules);
          setIsFirebaseConnected(true);
        }}
      />
    </div>
  );
}
