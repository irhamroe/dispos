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
  initialStudentPermits,
  RombelClass
} from './data/initialData';
import { 
  AdminUser, 
  AttendanceRecord, 
  DisciplineRecord, 
  Student, 
  DisciplineStatus, 
  WaliKelasTeacher, 
  ViolationRule, 
  SchoolProfile,
  StudentPermitRecord,
  StudentPermitStatus
} from './types';
import { sortClasses, sortStudents, sortWaliKelas, sortDisciplineRecords, sortViolationRules } from './utils/sortUtils';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { DailyAttendanceView } from './components/DailyAttendanceView';
import { RecapAttendanceView } from './components/RecapAttendanceView';
import { PermissionLetterRecapView } from './components/PermissionLetterRecapView';
import { PublicStudentPermitView } from './components/PublicStudentPermitView';
import { StudentPermitManagementView } from './components/StudentPermitManagementView';
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
  deleteAllDocumentsInCollection,
  saveDocument,
  deleteDocument,
  saveAttendanceBatch,
  saveStudent,
  saveDisciplineRecord,
  deleteDisciplineRecord as deleteDisciplineFromDb,
  saveStudentPermit,
  deleteStudentPermit,
  COLLECTIONS
} from './services/firestoreService';
import { MdBackgroundBlobs } from './components/md3/MdBackgroundBlobs';
import { getTodayIndonesian, getTodayDateString, formatDayAndDateIndonesian } from './utils/exportUtils';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      localStorage.removeItem('app_sman1batu_admin_user');
      localStorage.removeItem('app_sman1batu_admin_user_v2');
      const saved = localStorage.getItem('app_sman1batu_admin_user_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.username && parsed?.role) return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Classes state (36 Rombel X-1 to XII-12)
  const [classes, setClasses] = useState<RombelClass[]>(() => {
    try {
      localStorage.removeItem('app_sman1batu_classes');
      localStorage.removeItem('app_sman1batu_classes_v2');
      const saved = localStorage.getItem('app_sman1batu_classes_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 36 && parsed[0]?.homeroom === initialClasses[0]?.homeroom) {
          return sortClasses(parsed);
        }
      }
      const sorted = sortClasses(initialClasses);
      localStorage.setItem('app_sman1batu_classes_v4', JSON.stringify(sorted));
      return sorted;
    } catch {
      return sortClasses(initialClasses);
    }
  });

  // Wali Kelas state (36 Teachers)
  const [waliKelasList, setWaliKelasList] = useState<WaliKelasTeacher[]>(() => {
    try {
      localStorage.removeItem('app_sman1batu_walikelas');
      localStorage.removeItem('app_sman1batu_walikelas_v2');
      const saved = localStorage.getItem('app_sman1batu_walikelas_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 36 && parsed[0]?.name === initialWaliKelas[0]?.name) {
          return sortWaliKelas(parsed);
        }
      }
      const sorted = sortWaliKelas(initialWaliKelas);
      localStorage.setItem('app_sman1batu_walikelas_v4', JSON.stringify(sorted));
      return sorted;
    } catch {
      return sortWaliKelas(initialWaliKelas);
    }
  });

  // Students state (36 Rombel, 1,274 students)
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      localStorage.removeItem('app_sman1batu_students');
      localStorage.removeItem('app_sman1batu_discipline');
      const saved = localStorage.getItem('app_sman1batu_students_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === initialStudents.length && parsed[0]?.name === initialStudents[0]?.name) {
          return sortStudents(parsed);
        }
      }
      const sorted = sortStudents(initialStudents);
      localStorage.setItem('app_sman1batu_students_v2', JSON.stringify(sorted));
      return sorted;
    } catch {
      return sortStudents(initialStudents);
    }
  });

  // Attendance Records state (H, I, S, A, D)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('app_sman1batu_attendance_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 500) return parsed;
      }
      return generateInitialAttendance(initialStudents);
    } catch {
      return generateInitialAttendance(initialStudents);
    }
  });

  // Discipline Records state (sorted by latest input first)
  const [disciplineRecords, setDisciplineRecords] = useState<DisciplineRecord[]>(() => {
    try {
      const saved = localStorage.getItem('app_sman1batu_discipline_v2');
      return saved ? sortDisciplineRecords(JSON.parse(saved)) : initialDisciplineRecords;
    } catch {
      return initialDisciplineRecords;
    }
  });

  // Violation Rules Catalog state (Official 40 rules with codes A1-A17, B1-B7, C1-C4, D1-D12)
  const [violationRules, setViolationRules] = useState<ViolationRule[]>(() => {
    try {
      localStorage.removeItem('app_sman1batu_violation_rules');
      localStorage.removeItem('app_sman1batu_violation_rules_v2');
      localStorage.removeItem('app_sman1batu_violation_rules_v3');
      localStorage.removeItem('app_sman1batu_violation_rules_v4');
      localStorage.removeItem('app_sman1batu_violation_rules_v5');
      const saved = localStorage.getItem('app_sman1batu_violation_rules_v6');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= sampleViolationCatalog.length && parsed.some((r) => r.code === 'B7')) {
          return sortViolationRules(parsed);
        }
      }
      const sorted = sortViolationRules(sampleViolationCatalog);
      localStorage.setItem('app_sman1batu_violation_rules_v6', JSON.stringify(sorted));
      return sorted;
    } catch {
      return sortViolationRules(sampleViolationCatalog);
    }
  });

  // Optional Points System Setting State (Default: True)
  const [enablePointsSystem, setEnablePointsSystem] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('app_sman1batu_enable_points');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // School Profile state with persistent LocalStorage and Cloud sync
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    try {
      const saved = localStorage.getItem('app_sman1batu_school_profile_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.principalName) return { ...initialSchoolProfile, ...parsed };
      }
      return initialSchoolProfile;
    } catch {
      return initialSchoolProfile;
    }
  });

  const handleUpdateSchoolProfile = (updated: Partial<SchoolProfile>) => {
    setSchoolProfile((prev) => {
      const next = { ...prev, ...updated };
      localStorage.setItem('app_sman1batu_school_profile_v3', JSON.stringify(next));
      if (isFirebaseConfigured()) {
        saveDocument(COLLECTIONS.SCHOOL_PROFILE, { id: 'main_profile', ...next });
      }
      return next;
    });
  };

  // Users state (Multi-Role: Admin + 36 Wali Kelas + Guru Mapel)
  const [users, setUsers] = useState<AdminUser[]>(() => {
    try {
      localStorage.removeItem('app_sman1batu_users');
      localStorage.removeItem('app_sman1batu_users_v2');
      localStorage.removeItem('app_sman1batu_users_v4');
      const saved = localStorage.getItem('app_sman1batu_users_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= initialUsers.length && parsed.some((u) => u.name === 'Panji Penatas, S.Pd')) {
          return parsed;
        }
      }
      localStorage.setItem('app_sman1batu_users_v5', JSON.stringify(initialUsers));
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

  // Public Student Permit View state (Direct link or QR scan)
  const [isPublicPermitOpen, setIsPublicPermitOpen] = useState<boolean>(() => {
    try {
      const search = window.location.search;
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(search);
      return urlParams.get('view') === 'izin-siswa' || 
             urlParams.get('tab') === 'izin-siswa' || 
             hash.includes('izin-siswa');
    } catch {
      return false;
    }
  });

  // Student Permits state
  const [studentPermits, setStudentPermits] = useState<StudentPermitRecord[]>(() => {
    try {
      const saved = localStorage.getItem('app_sman1batu_student_permits_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('app_sman1batu_student_permits_v1', JSON.stringify(initialStudentPermits));
      return initialStudentPermits;
    } catch {
      return initialStudentPermits;
    }
  });

  // Create new permit (Public form submission)
  const handleCreateStudentPermit = (permitData: Omit<StudentPermitRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecord: StudentPermitRecord = {
      ...permitData,
      id: `PERMIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setStudentPermits((prev) => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('app_sman1batu_student_permits_v1', JSON.stringify(updated));
      return updated;
    });
    // Instant Cloud Firestore sync for multi-device support (HP <-> Laptop)
    saveStudentPermit(newRecord).catch((e) => console.warn('Failed to sync permit to Cloud Firestore:', e));
  };

  // Update permit status (Approve, Reject, or Mark Returned)
  const handleUpdateStudentPermitStatus = (
    permitId: string, 
    status: StudentPermitStatus, 
    reviewedBy?: string, 
    rejectionReason?: string
  ) => {
    setStudentPermits((prev) => {
      let targetRecord: StudentPermitRecord | null = null;
      const updated = prev.map((p) => {
        if (p.id === permitId) {
          const modRecord: StudentPermitRecord = {
            ...p,
            status,
            reviewedBy: reviewedBy || currentUser?.name || 'Petugas Piket / Guru Dispos',
            rejectionReason: rejectionReason !== undefined ? rejectionReason : p.rejectionReason,
            actualReturnTime: status === 'Sudah Kembali' 
              ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
              : p.actualReturnTime,
            updatedAt: new Date().toISOString(),
          };
          targetRecord = modRecord;
          return modRecord;
        }
        return p;
      });
      localStorage.setItem('app_sman1batu_student_permits_v1', JSON.stringify(updated));
      if (targetRecord) {
        saveStudentPermit(targetRecord).catch((e) => console.warn('Failed to sync permit update to Cloud Firestore:', e));
      }
      return updated;
    });
  };

  // Delete permit
  const handleDeleteStudentPermit = (permitId: string) => {
    setStudentPermits((prev) => {
      const updated = prev.filter((p) => p.id !== permitId);
      localStorage.setItem('app_sman1batu_student_permits_v1', JSON.stringify(updated));
      return updated;
    });
    deleteStudentPermit(permitId).catch((e) => console.warn('Failed to delete permit from Cloud Firestore:', e));
  };

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

    // Initial check: if Firestore is clean/empty or has stale demo data, seed real data
    const checkAndSeedOnline = async () => {
      try {
        const [remoteStudents, remoteClasses, remoteWali, remoteRules, remoteUsers] = await Promise.all([
          fetchAllDocuments<Student>(COLLECTIONS.STUDENTS),
          fetchAllDocuments<RombelClass>(COLLECTIONS.CLASSES),
          fetchAllDocuments<WaliKelasTeacher>(COLLECTIONS.WALI_KELAS),
          fetchAllDocuments<ViolationRule>(COLLECTIONS.VIOLATION_RULES),
          fetchAllDocuments<AdminUser>(COLLECTIONS.USERS),
        ]);

        const isStaleStudentData = remoteStudents.length > 0 && (
          remoteStudents.length !== initialStudents.length ||
          !remoteStudents.some((s) => s.name === 'Ailin Chaya Agatha')
        );

        if (remoteStudents.length === 0 || isStaleStudentData) {
          console.log('Syncing real student dataset (1,274 students) to Cloud Firestore...');
          await deleteAllDocumentsInCollection(COLLECTIONS.STUDENTS);
          await batchSaveDocuments(COLLECTIONS.STUDENTS, initialStudents);
          setStudents(sortStudents(initialStudents));
        }

        const isStaleWali = remoteWali.length > 0 && (
          remoteWali.length < 36 ||
          remoteWali[0]?.name !== initialWaliKelas[0]?.name ||
          remoteWali.some((w) => w.name === 'Drs. H. Mulyadi')
        );
        if (remoteWali.length === 0 || isStaleWali) {
          await deleteAllDocumentsInCollection(COLLECTIONS.WALI_KELAS);
          await batchSaveDocuments(COLLECTIONS.WALI_KELAS, initialWaliKelas);
          setWaliKelasList(sortWaliKelas(initialWaliKelas));
        }

        const isStaleClasses = remoteClasses.length > 0 && (
          remoteClasses.length < 36 ||
          remoteClasses[0]?.homeroom !== initialClasses[0]?.homeroom
        );
        if (remoteClasses.length === 0 || isStaleClasses) {
          await deleteAllDocumentsInCollection(COLLECTIONS.CLASSES);
          await batchSaveDocuments(COLLECTIONS.CLASSES, initialClasses);
          setClasses(sortClasses(initialClasses));
        }

        const isStaleUsers = remoteUsers.length > 0 && (
          remoteUsers.length < initialUsers.length ||
          !remoteUsers.some((u) => u.name === 'Panji Penatas, S.Pd') ||
          remoteUsers.some((u) => u.username === 'walikelas' || u.username === 'operator')
        );
        if (remoteUsers.length === 0 || isStaleUsers) {
          await deleteAllDocumentsInCollection(COLLECTIONS.USERS);
          await batchSaveDocuments(COLLECTIONS.USERS, initialUsers);
          setUsers(initialUsers);
        }

        const isStaleRules = remoteRules.length > 0 && (
          remoteRules.length < sampleViolationCatalog.length ||
          !remoteRules.some((r) => r.code === 'A1') ||
          !remoteRules.some((r) => r.code === 'B7') ||
          !remoteRules.some((r) => r.code === 'D12')
        );
        if (remoteRules.length === 0 || isStaleRules) {
          await deleteAllDocumentsInCollection(COLLECTIONS.VIOLATION_RULES);
          await batchSaveDocuments(COLLECTIONS.VIOLATION_RULES, sampleViolationCatalog);
          setViolationRules(sampleViolationCatalog);
        }

        // Check & seed student permits or merge un-synced local permits (e.g. pending permits created on laptop)
        const remotePermits = await fetchAllDocuments<StudentPermitRecord>(COLLECTIONS.STUDENT_PERMITS);
        if (remotePermits.length === 0) {
          const toUpload = studentPermits.length > 0 ? studentPermits : initialStudentPermits;
          await batchSaveDocuments(COLLECTIONS.STUDENT_PERMITS, toUpload);
        } else {
          const remoteIds = new Set(remotePermits.map((p) => p.id));
          const missingInCloud = studentPermits.filter((p) => !remoteIds.has(p.id));
          if (missingInCloud.length > 0) {
            console.log(`Syncing ${missingInCloud.length} local permit(s) to Cloud Firestore...`);
            await batchSaveDocuments(COLLECTIONS.STUDENT_PERMITS, missingInCloud);
          }
        }
      } catch (e) {
        console.warn('Auto-seed check failed:', e);
      }
    };

    checkAndSeedOnline();

    // 1. Realtime Students subscription (HP <-> Laptop sync)
    const unsubStudents = subscribeToCollection<Student>(COLLECTIONS.STUDENTS, (data) => {
      if (data && data.length > 0) {
        setStudents(sortStudents(data));
      }
    });

    // 2. Realtime Classes subscription
    const unsubClasses = subscribeToCollection<RombelClass>(COLLECTIONS.CLASSES, (data) => {
      if (data && data.length > 0) {
        setClasses(sortClasses(data));
      }
    });

    // 3. Realtime Wali Kelas subscription
    const unsubWali = subscribeToCollection<WaliKelasTeacher>(COLLECTIONS.WALI_KELAS, (data) => {
      if (data && data.length > 0) {
        setWaliKelasList(sortWaliKelas(data));
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
        setDisciplineRecords(sortDisciplineRecords(data));
      }
    });

    // 6. Realtime Violation Rules subscription
    const unsubRules = subscribeToCollection<ViolationRule>(COLLECTIONS.VIOLATION_RULES, (data) => {
      if (data && data.length > 0) {
        setViolationRules(sortViolationRules(data));
      }
    });

    // 7. Realtime Users subscription
    const unsubUsers = subscribeToCollection<AdminUser>(COLLECTIONS.USERS, (data) => {
      if (data && data.length > 0) {
        setUsers(data);
      }
    });

    // 8. Realtime School Profile subscription (Principal name, rank, and NIP sync)
    const unsubSchoolProfile = subscribeToCollection<SchoolProfile>(COLLECTIONS.SCHOOL_PROFILE, (data) => {
      if (data && data.length > 0 && data[0]?.principalName) {
        setSchoolProfile((prev) => ({ ...prev, ...data[0] }));
        localStorage.setItem('app_sman1batu_school_profile_v3', JSON.stringify({ ...initialSchoolProfile, ...data[0] }));
      }
    });

    // 9. Realtime Student Permits subscription (Instant multi-device sync between HP & Laptop)
    const unsubPermits = subscribeToCollection<StudentPermitRecord>(COLLECTIONS.STUDENT_PERMITS, (data) => {
      if (data) {
        const sorted = [...data].sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(`${a.date}T${a.timeSubmitted || '00:00'}:00`).getTime() || 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(`${b.date}T${b.timeSubmitted || '00:00'}:00`).getTime() || 0;
          return timeB - timeA;
        });
        setStudentPermits(sorted);
        localStorage.setItem('app_sman1batu_student_permits_v1', JSON.stringify(sorted));
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
      if (unsubSchoolProfile) unsubSchoolProfile();
      if (unsubPermits) unsubPermits();
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
      localStorage.setItem('app_sman1batu_admin_user_v4', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('app_sman1batu_admin_user_v4');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('app_sman1batu_classes_v4', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('app_sman1batu_walikelas_v4', JSON.stringify(waliKelasList));
  }, [waliKelasList]);

  useEffect(() => {
    localStorage.setItem('app_sman1batu_students_v2', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('app_sman1batu_attendance_v2', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('app_sman1batu_discipline_v2', JSON.stringify(disciplineRecords));
  }, [disciplineRecords]);

  useEffect(() => {
    localStorage.setItem('app_sman1batu_violation_rules_v6', JSON.stringify(violationRules));
  }, [violationRules]);

  useEffect(() => {
    localStorage.setItem('app_sman1batu_enable_points', JSON.stringify(enablePointsSystem));
  }, [enablePointsSystem]);

  useEffect(() => {
    localStorage.setItem('app_sman1batu_users_v5', JSON.stringify(users));
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
    setViolationRules((prev) => sortViolationRules([newRule, ...prev]));
    saveDocument(COLLECTIONS.VIOLATION_RULES, newRule).catch(() => {});
  };

  const handleEditViolationRule = (updated: ViolationRule) => {
    setViolationRules((prev) => sortViolationRules(prev.map((r) => (r.id === updated.id ? updated : r))));
    saveDocument(COLLECTIONS.VIOLATION_RULES, updated).catch(() => {});
  };

  const handleDeleteViolationRule = (ruleId: string) => {
    setViolationRules((prev) => prev.filter((r) => r.id !== ruleId));
    deleteDocument(COLLECTIONS.VIOLATION_RULES, ruleId).catch(() => {});
  };

  const handleResetViolationRules = async () => {
    setViolationRules(sampleViolationCatalog);
    localStorage.setItem('app_sman1batu_violation_rules_v6', JSON.stringify(sampleViolationCatalog));
    if (isFirebaseConfigured()) {
      await deleteAllDocumentsInCollection(COLLECTIONS.VIOLATION_RULES);
      await batchSaveDocuments(COLLECTIONS.VIOLATION_RULES, sampleViolationCatalog);
    }
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
    setDisciplineRecords((prev) => sortDisciplineRecords([newRecord, ...prev]));
    saveDisciplineRecord(newRecord).catch(() => {});
  };

  // Update discipline record status
  const handleUpdateDisciplineStatus = (id: string, status: DisciplineStatus) => {
    setDisciplineRecords((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, status } : r));
      const target = updated.find((r) => r.id === id);
      if (target) saveDisciplineRecord(target).catch(() => {});
      return sortDisciplineRecords(updated);
    });
  };

  // Update full discipline record (including coaching)
  const handleUpdateDisciplineRecord = (updatedRecord: DisciplineRecord) => {
    setDisciplineRecords((prev) =>
      sortDisciplineRecords(prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)))
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

  // Reset / Force sync to official 1,274 students list
  const handleResetToDefaultStudents = async () => {
    setStudents(initialStudents);
    localStorage.setItem('app_sman1batu_students_v2', JSON.stringify(initialStudents));
    if (isFirebaseConfigured()) {
      await deleteAllDocumentsInCollection(COLLECTIONS.STUDENTS);
      await batchSaveDocuments(COLLECTIONS.STUDENTS, initialStudents);
    }
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

  // If public permit portal is active (via QR code or direct button), render it without requiring login
  if (isPublicPermitOpen) {
    return (
      <PublicStudentPermitView
        students={students}
        classes={classes}
        schoolProfile={schoolProfile}
        onSubmitPermit={handleCreateStudentPermit}
        onBackToApp={() => {
          setIsPublicPermitOpen(false);
          // Clean URL params if any
          if (window.location.search.includes('izin-siswa') || window.location.hash.includes('izin-siswa')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
        isTeacherOrAdminLoggedIn={!!currentUser}
      />
    );
  }

  // If not logged in, display the secure login screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        schoolProfile={schoolProfile}
        users={users}
        onOpenPublicPermit={() => setIsPublicPermitOpen(true)}
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

  // Calculate pending student permits waiting for teacher/piket review
  const totalPendingPermits = studentPermits.filter(
    (p) => p.status === 'Menunggu' || (p.status as any) === 'Menunggu Persetujuan'
  ).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-roboto text-[#0F172A] relative overflow-x-hidden print:bg-white print:overflow-visible print:min-h-0 print:block print:p-0 print:m-0">
      {/* Material You Layered Organic Ambient Blobs */}
      <MdBackgroundBlobs />

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        schoolProfile={schoolProfile}
        onLogout={handleLogout}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        todayStr={formatDayAndDateIndonesian(getTodayDateString())}
        isFirebaseConnected={isFirebaseConnected}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        totalPendingPermits={totalPendingPermits}
        onNavigatePermits={() => handleSelectTab('layanan-izin-siswa')}
      />

      <div className="flex-1 flex relative z-10 print:block print:p-0 print:m-0">
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
          totalPendingPermits={totalPendingPermits}
          totalUsers={users.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-80 pt-5 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none print:w-full print:block">
          {currentTab === 'dashboard' && (
            <DashboardView
              students={students}
              attendanceRecords={attendanceRecords}
              disciplineRecords={disciplineRecords}
              classes={classes}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onNavigateTab={handleSelectTab}
              studentPermits={studentPermits}
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
              schoolProfile={schoolProfile}
            />
          )}

          {currentTab === 'rekap-surat-izin' && (
            <PermissionLetterRecapView
              students={students}
              attendanceRecords={attendanceRecords}
              classes={classes}
              schoolProfile={schoolProfile}
              onUpdateAttendance={handleSaveAttendance}
            />
          )}

          {currentTab === 'layanan-izin-siswa' && (
            <StudentPermitManagementView
              permits={studentPermits}
              students={students}
              classes={classes}
              schoolProfile={schoolProfile}
              currentUserName={currentUser.name}
              onUpdatePermit={(updated) => {
                setStudentPermits((prev) => {
                  const next = prev.map((p) => p.id === updated.id ? updated : p);
                  localStorage.setItem('app_sman1batu_student_permits_v1', JSON.stringify(next));
                  return next;
                });
                saveStudentPermit(updated).catch((e) => console.warn('Failed to sync permit update to Cloud Firestore:', e));
              }}
              onDeletePermit={handleDeleteStudentPermit}
              onOpenPublicPortal={() => setIsPublicPermitOpen(true)}
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
              schoolProfile={schoolProfile}
              currentUserName={currentUser.name}
              initialStudentForModal={initialStudentForDisc}
              initialViolationForModal={initialViolationForDisc}
              onClearInitialModalData={() => {
                setInitialStudentForDisc(null);
                setInitialViolationForDisc('');
              }}
              violationRules={violationRules}
              enablePointsSystem={enablePointsSystem}
            />
          )}

          {currentTab === 'rekap-pelanggaran' && (
            <DisciplineRecapView
              disciplineRecords={disciplineRecords}
              students={students}
              schoolProfile={schoolProfile}
            />
          )}

          {currentTab === 'tagihan-pembinaan' && (
            <DisciplineDebtView
              disciplineRecords={disciplineRecords}
              students={students}
              schoolProfile={schoolProfile}
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
              schoolProfile={schoolProfile}
              onUpdateSchoolProfile={handleUpdateSchoolProfile}
              currentUserName={currentUser.name}
              enablePointsSystem={enablePointsSystem}
            />
          )}

          {currentTab === 'aturan-pelanggaran' && (
            <ViolationRulesView
              violationRules={violationRules}
              onAddRule={handleAddViolationRule}
              onEditRule={handleEditViolationRule}
              onDeleteRule={handleDeleteViolationRule}
              onResetRules={handleResetViolationRules}
              enablePointsSystem={enablePointsSystem}
              onTogglePointsSystem={setEnablePointsSystem}
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
              onResetToDefaultStudents={handleResetToDefaultStudents}
              initialClassFilter={selectedClassForStudentView}
              enablePointsSystem={enablePointsSystem}
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
        studentPermits={studentPermits}
        onDataSynced={(synced) => {
          if (synced.students) setStudents(synced.students);
          if (synced.classes) setClasses(synced.classes);
          if (synced.waliKelasList) setWaliKelasList(synced.waliKelasList);
          if (synced.attendanceRecords) setAttendanceRecords(synced.attendanceRecords);
          if (synced.disciplineRecords) setDisciplineRecords(synced.disciplineRecords);
          if (synced.violationRules) setViolationRules(synced.violationRules);
          if (synced.studentPermits) setStudentPermits(synced.studentPermits);
          setIsFirebaseConnected(true);
        }}
      />
    </div>
  );
}
