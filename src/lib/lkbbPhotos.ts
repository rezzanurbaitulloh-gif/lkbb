// Foto peleton LKBB asli (dokumentasi kegiatan LKBB, Wikimedia Commons).
// 7 CC0 (bebas) + 1 CC BY-SA 4.0 (Side L.K.B.B — kredit di footer).
// Dipakai sebagai fallback kartu tim bila tim belum upload foto.
// Data foto asli tim dari DB selalu diutamakan.
const H = "https://upload.wikimedia.org/wikipedia/commons/thumb";

export const LKBB_PHOTOS: string[] = [
  `${H}/d/d9/Penampilan_LKBB_oleh_anak_pramuka_SMA_Negeri_1_Selesai.jpg/960px-Penampilan_LKBB_oleh_anak_pramuka_SMA_Negeri_1_Selesai.jpg`,
  `${H}/c/c9/Penampilan_LKBB_oleh_anak_pramuka_pada_kegiatan_MPLS_SMA_Negeri_1_Selesai.jpg/960px-Penampilan_LKBB_oleh_anak_pramuka_pada_kegiatan_MPLS_SMA_Negeri_1_Selesai.jpg`,
  `${H}/a/ab/Para_personil_LKBB_pada_pertunjukan_pramuka_SMA_Negeri_1_Selesai_di_acara_MPLS.jpg/960px-Para_personil_LKBB_pada_pertunjukan_pramuka_SMA_Negeri_1_Selesai_di_acara_MPLS.jpg`,
  `${H}/f/f9/Penampilan_LKBB_oleh_anak_pramuka_SMA_Negeri_1_Selesai_pada_kegiatan_MPLS_2026.jpg/960px-Penampilan_LKBB_oleh_anak_pramuka_SMA_Negeri_1_Selesai_pada_kegiatan_MPLS_2026.jpg`,
  `${H}/3/32/Side_L.K.B.B.jpg/960px-Side_L.K.B.B.jpg`,
  `${H}/d/d1/Foto_perlombaaan_LKBB.jpg/960px-Foto_perlombaaan_LKBB.jpg`,
  `${H}/9/93/Seorang_danton_sedang_mengatur_formasi_gerakan_LKBB.jpg/960px-Seorang_danton_sedang_mengatur_formasi_gerakan_LKBB.jpg`,
  `${H}/6/67/Foto_seorang_danton_saat_memimpin_gerakan_LKBB.jpg/960px-Foto_seorang_danton_saat_memimpin_gerakan_LKBB.jpg`,
];

/** Foto fallback peleton LKBB berdasarkan index — deterministik, bukan random. */
export function lkbbPhoto(index: number): string {
  return LKBB_PHOTOS[Math.abs(index) % LKBB_PHOTOS.length];
}
