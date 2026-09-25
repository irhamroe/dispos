import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
  Unsubscribe,
  DocumentData
} from 'firebase/firestore';
import { getDb, isFirebaseConfigured } from './firebase';
import {
  Student,
  AttendanceRecord,
  DisciplineRecord,
  WaliKelasTeacher,
  ViolationRule,
  AdminUser,
  SchoolProfile
} from '../types';
import { RombelClass } from '../data/initialData';

export const COLLECTIONS = {
  STUDENTS: 'students',
  CLASSES: 'classes',
  WALI_KELAS: 'waliKelas',
  ATTENDANCE: 'attendance',
  DISCIPLINE: 'discipline',
  VIOLATION_RULES: 'violationRules',
  USERS: 'users',
  SCHOOL_PROFILE: 'schoolProfile',
};

// =======================
// Generic Fetch Helpers
// =======================

export const fetchAllDocuments = async <T>(collectionName: string): Promise<T[]> => {
  const db = getDb();
  if (!db || !isFirebaseConfigured()) return [];

  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as T);
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    return [];
  }
};

// =======================
// Realtime Subscriptions
// =======================

export const subscribeToCollection = <T>(
  collectionName: string,
  onData: (data: T[]) => void,
  onError?: (err: any) => void
): Unsubscribe | null => {
  const db = getDb();
  if (!db || !isFirebaseConfigured()) return null;

  try {
    const colRef = collection(db, collectionName);
    return onSnapshot(
      colRef,
      (snap) => {
        const items = snap.docs.map((d) => d.data() as T);
        onData(items);
      },
      (error) => {
        console.error(`Realtime error for ${collectionName}:`, error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.error(`Failed to subscribe to ${collectionName}:`, err);
    return null;
  }
};

// =======================
// Single Document Operations
// =======================

export const saveDocument = async <T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<boolean> => {
  const db = getDb();
  if (!db || !isFirebaseConfigured()) return false;

  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, item, { merge: true });
    return true;
  } catch (error) {
    console.error(`Error saving doc to ${collectionName}:`, error);
    return false;
  }
};

export const deleteDocument = async (collectionName: string, id: string): Promise<boolean> => {
  const db = getDb();
  if (!db || !isFirebaseConfigured()) return false;

  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Error deleting doc ${id} from ${collectionName}:`, error);
    return false;
  }
};

// =======================
// Batch Seed / Sync Helpers
// =======================

export const batchSaveDocuments = async <T extends { id: string }>(
  collectionName: string,
  items: T[],
  onProgress?: (current: number, total: number) => void
): Promise<boolean> => {
  const db = getDb();
  if (!db || !isFirebaseConfigured() || items.length === 0) return false;

  try {
    // Firestore batch limit is 500 operations
    const CHUNK_SIZE = 400;
    let processed = 0;

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const item of chunk) {
        const docRef = doc(db, collectionName, item.id);
        batch.set(docRef, item, { merge: true });
      }

      await batch.commit();
      processed += chunk.length;
      if (onProgress) {
        onProgress(processed, items.length);
      }
    }

    return true;
  } catch (error) {
    console.error(`Error batch saving ${collectionName}:`, error);
    return false;
  }
};

// =======================
// Attendance Specific Operations
// =======================

export const saveAttendanceBatch = async (records: AttendanceRecord[]): Promise<boolean> => {
  return batchSaveDocuments(COLLECTIONS.ATTENDANCE, records);
};

export const saveSingleAttendance = async (record: AttendanceRecord): Promise<boolean> => {
  return saveDocument(COLLECTIONS.ATTENDANCE, record);
};

// =======================
// Student Specific Operations
// =======================

export const saveStudent = async (student: Student): Promise<boolean> => {
  return saveDocument(COLLECTIONS.STUDENTS, student);
};

// =======================
// Discipline Specific Operations
// =======================

export const saveDisciplineRecord = async (record: DisciplineRecord): Promise<boolean> => {
  return saveDocument(COLLECTIONS.DISCIPLINE, record);
};

export const deleteDisciplineRecord = async (id: string): Promise<boolean> => {
  return deleteDocument(COLLECTIONS.DISCIPLINE, id);
};
