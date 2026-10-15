/**
 * Format Utility Functions for Sistem Informasi SMAN 1 Batu
 */

// Kamus gelar akademik & gelar kehormatan umum di Indonesia
const KNOWN_DEGREES: Record<string, string> = {
  'spd': 'S.Pd',
  's.pd': 'S.Pd',
  's.pd.': 'S.Pd.',
  'mpd': 'M.Pd',
  'm.pd': 'M.Pd',
  'm.pd.': 'M.Pd.',
  'skom': 'S.Kom',
  's.kom': 'S.Kom',
  's.kom.': 'S.Kom.',
  'mkom': 'M.Kom',
  'm.kom': 'M.Kom',
  'm.kom.': 'M.Kom.',
  'ssi': 'S.Si',
  's.si': 'S.Si',
  's.si.': 'S.Si.',
  'msi': 'M.Si',
  'm.si': 'M.Si',
  'm.si.': 'M.Si.',
  'ssos': 'S.Sos',
  's.sos': 'S.Sos',
  's.sos.': 'S.Sos.',
  'msos': 'M.Sos',
  'm.sos': 'M.Sos',
  'm.sos.': 'M.Sos.',
  'se': 'S.E.',
  's.e': 'S.E.',
  's.e.': 'S.E.',
  'sh': 'S.H',
  's.h': 'S.H',
  's.h.': 'S.H.',
  'ssn': 'S.Sn',
  's.sn': 'S.Sn',
  's.sn.': 'S.Sn.',
  'spsi': 'S.Psi',
  's.psi': 'S.Psi',
  's.psi.': 'S.Psi.',
  'mpsi': 'M.Psi',
  'm.psi': 'M.Psi',
  'm.psi.': 'M.Psi.',
  'sag': 'S.Ag',
  's.ag': 'S.Ag',
  's.ag.': 'S.Ag.',
  'mag': 'M.Ag',
  'm.ag': 'M.Ag',
  'm.ag.': 'M.Ag.',
  'spdi': 'S.Pd.I',
  's.pd.i': 'S.Pd.I',
  's.pd.i.': 'S.Pd.I',
  'st': 'ST',
  's.t.': 'ST',
  's.t': 'ST',
  'mt': 'MT',
  'm.t.': 'MT',
  'm.t': 'MT',
  'ss': 'S.S',
  's.s': 'S.S',
  's.s.': 'S.S',
  'lc': 'Lc',
  'lc.': 'Lc',
  'drs': 'Drs.',
  'drs.': 'Drs.',
  'dra': 'Dra.',
  'dra.': 'Dra.',
  'mm': 'M.M.',
  'm.m': 'M.M.',
  'm.m.': 'M.M.',
  'gr': 'Gr.',
  'gr.': 'Gr.',
  'dr': 'Dr.',
  'dr.': 'Dr.',
  'prof': 'Prof.',
  'prof.': 'Prof.'
};

/**
 * Memeriksa apakah string nama menggunakan huruf kapital semua (ALL CAPS)
 */
export function isAllCapsName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const lettersOnly = name.replace(/[^a-zA-Z]/g, '');
  return lettersOnly.length >= 2 && lettersOnly === lettersOnly.toUpperCase();
}

/**
 * Mengubah nama siswa atau guru menjadi format Title Case
 * (Hanya huruf awal tiap kata yang kapital, dan gelar akademik tetap rapi).
 * 
 * Contoh:
 * - "ACHMAD DWI SYAHRUDIN" -> "Achmad Dwi Syahrudin"
 * - "ALDA MAR'ATUS SHOLIHAH" -> "Alda Mar'atus Sholihah"
 * - "ANTO DWI CAHYONO, S.PD., M.M." -> "Anto Dwi Cahyono, S.Pd., M.M."
 */
export function formatNameTitleCase(name: string): string {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';

  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly.length === 0) return trimmed;

  // Pisahkan berdasarkan tanda koma terlebih dahulu untuk memisahkan nama dasar dan gelar
  const parts = trimmed.split(',');
  const formattedParts = parts.map((part) => {
    const words = part.trim().split(/\s+/).filter(Boolean);
    const convertedWords = words.map((w) => {
      const cleanW = w.toLowerCase().replace(/[,]/g, '');
      if (KNOWN_DEGREES[cleanW]) {
        return KNOWN_DEGREES[cleanW];
      }
      // Kata dengan tanda hubung, misal Al-Ghifari
      if (w.includes('-')) {
        return w
          .split('-')
          .map((sub) => (sub ? sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase() : ''))
          .join('-');
      }
      // Kata dengan apostrof / tanda petik, misal Mar'atus atau Ma'ruf
      if (w.includes("'")) {
        return w
          .split("'")
          .map((sub, idx) => (idx === 0 ? sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase() : sub.toLowerCase()))
          .join("'");
      }
      // Kata biasa
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });
    return convertedWords.join(' ');
  });

  return formattedParts.join(', ');
}
