import { Student, WaliKelasTeacher, DisciplineRecord } from '../types';
import { RombelClass } from '../data/initialData';

const GRADE_ORDER: Record<string, number> = {
  'X': 1,
  'XI': 2,
  'XII': 3,
};

/**
 * Compare two class names using natural sorting (e.g. "X-1", "X-2", ..., "X-10", "X-11", "X-12", "XI-1", etc.)
 */
export const compareClassNames = (a?: string, b?: string): number => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  if (a === b) return 0;

  // Clean strings (remove "Kelas", "Rombel", leading/trailing whitespace)
  const cleanA = a.replace(/^(Kelas|Rombel)\s+/i, '').trim();
  const cleanB = b.replace(/^(Kelas|Rombel)\s+/i, '').trim();

  // Pattern match X/XI/XII and number (e.g., "X-1", "XI-10", "XII-3")
  const regex = /^(X|XI|XII)[-\s._]?(\d+)$/i;
  const matchA = cleanA.match(regex);
  const matchB = cleanB.match(regex);

  if (matchA && matchB) {
    const gradeA = matchA[1].toUpperCase();
    const gradeB = matchB[1].toUpperCase();
    const orderA = GRADE_ORDER[gradeA] ?? 99;
    const orderB = GRADE_ORDER[gradeB] ?? 99;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const numA = parseInt(matchA[2], 10);
    const numB = parseInt(matchB[2], 10);
    return numA - numB;
  }

  // Fallback to Indonesian natural localeCompare
  return cleanA.localeCompare(cleanB, 'id', { numeric: true, sensitivity: 'base' });
};

/**
 * Sort any list of class objects or strings in natural order (X-1 to X-12, XI-1 to XI-12, XII-1 to XII-12)
 */
export const sortClasses = <T extends { name?: string; className?: string; assignedClass?: string } | string>(
  classesList: T[]
): T[] => {
  return [...classesList].sort((a, b) => {
    const nameA = typeof a === 'string' ? a : (a.name || a.className || a.assignedClass || '');
    const nameB = typeof b === 'string' ? b : (b.name || b.className || b.assignedClass || '');
    return compareClassNames(nameA, nameB);
  });
};

/**
 * Sort students: first by class name (natural order), then by student name alphabetically
 */
export const sortStudents = <T extends { name: string; className?: string; grade?: string }>(
  studentList: T[]
): T[] => {
  return [...studentList].sort((a, b) => {
    if (a.className && b.className && a.className !== b.className) {
      const classComp = compareClassNames(a.className, b.className);
      if (classComp !== 0) return classComp;
    }
    return a.name.localeCompare(b.name, 'id', { sensitivity: 'base' });
  });
};

/**
 * Sort wali kelas teachers by their class name naturally
 */
export const sortWaliKelas = (teachersList: WaliKelasTeacher[]): WaliKelasTeacher[] => {
  return [...teachersList].sort((a, b) => compareClassNames(a.className, b.className));
};

/**
 * Sort discipline records by latest input / incident date and latest ID timestamp descending
 * (Data yang terakhir dimasukkan akan selalu berada di urutan paling atas)
 */
export const sortDisciplineRecords = <T extends { date?: string; id?: string; createdAt?: string }>(
  records: T[]
): T[] => {
  return [...records].sort((a, b) => {
    // 1. Compare explicit createdAt if present
    if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt) {
      return b.createdAt.localeCompare(a.createdAt);
    }
    // 2. Compare incident date descending (e.g. "2026-10-05" before "2026-09-17")
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }
    // 3. Compare ID numeric timestamp / counter descending (e.g. disc-1728104593821)
    const extractNum = (id?: string): number => {
      if (!id) return 0;
      const matches = id.match(/\d+/g);
      if (matches && matches.length > 0) {
        return parseInt(matches[matches.length - 1], 10) || 0;
      }
      return 0;
    };
    const numA = extractNum(a.id);
    const numB = extractNum(b.id);
    if (numA !== numB) {
      return numB - numA;
    }
    return (b.id || '').localeCompare(a.id || '');
  });
};

