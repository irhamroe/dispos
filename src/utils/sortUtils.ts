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
