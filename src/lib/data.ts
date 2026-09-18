import type { Peleton, Judge, Sponsor, NewsItem, Announcement, FAQ, TimelineStage } from "./types"

// DEPRECATED — kept for reference only, not used in production (DB-driven)
// Semua gambar menunjuk ke aset resmi lokal. Dilarang memakai stock/Unsplash.
const IMG = {
  // Foto tim resmi berasal dari database (foto upload peleton asli).
  // Fallback deprecated ini memakai poster & logo resmi lokal saja.
  peleton1: "/assets/poster/lkbb-poster.jpg",
  peleton2: "/assets/poster/lkbb-poster.jpg",
  peleton3: "/assets/poster/lkbb-poster.jpg",
  peleton4: "/assets/poster/lkbb-poster.jpg",
  peleton5: "/assets/poster/lkbb-poster.jpg",
  peleton6: "/assets/poster/lkbb-poster.jpg",
  peleton7: "/assets/poster/lkbb-poster.jpg",
  peleton8: "/assets/poster/lkbb-poster.jpg",
  peleton9: "/assets/poster/lkbb-poster.jpg",
  peleton10:"/assets/poster/lkbb-poster.jpg",
  // Juri — use formal uniform / portrait, closest to real juri in poster
  juri1: "/assets/poster/lkbb-poster.jpg", // will be cropped via CSS; real juri photos are in poster
  juri2: "/assets/poster/lkbb-poster.jpg",
  juri3: "/assets/poster/lkbb-poster.jpg",
}

// Deprecated: per Final Concept §7, tim hanya foto+logo, tidak ada members/gallery per tim
// Kept as empty arrays to avoid breakage in legacy code, but not used in production UI
function members(_seed:number): any[] { return [] }
function gallery(_seed:number): any[] { return [] }

export const peletons: Peleton[] = [
  {
    id: "1", slug: "smkn-1-kertosono", number: "01",
    name: "SMKN 1 KERTOSONO",
    school: "SMK Negeri 1 Kertosono", city: "Kertosono", province: "Jawa Timur", category: "SMA",
    description: "Peleton dengan disiplin tinggi, kekompakan solid, dan semangat juang yang luar biasa. Telah meraih berbagai prestasi di tingkat kabupaten dan provinsi. Berlatih 5 kali seminggu dengan dedikasi penuh untuk memberikan penampilan terbaik di LKBB Javasoma 2026.",
    image: IMG.peleton1, cover: IMG.peleton1,
    members: members(1), gallery: gallery(1),
    support: 31200, status: "Verified", verified: true, createdAt: "2026-08-10"
  },
  {
    id: "2", slug: "smpn-1-nganjuk", number: "02",
    name: "SMPN 1 NGANJUK",
    school: "SMP Negeri 1 Nganjuk", city: "Nganjuk", province: "Jawa Timur", category: "SMP",
    description: "Kekuatan muda dengan presisi gerakan yang memukau. Dikenal dengan variasi formasi kreatif dan kekompakan yang solid.",
    image: IMG.peleton2, cover: IMG.peleton2,
    members: members(2), gallery: gallery(2),
    support: 28400, status: "Verified", verified: true, createdAt: "2026-08-11"
  },
  {
    id: "3", slug: "sman-1-nganjuk", number: "03",
    name: "SMAN 1 NGANJUK",
    school: "SMA Negeri 1 Nganjuk", city: "Nganjuk", province: "Jawa Timur", category: "SMA",
    description: "Peleton senior dengan pengalaman kompetisi tingkat nasional. Menampilkan kedisiplinan dan ketegasan dalam setiap gerakan.",
    image: IMG.peleton3, cover: IMG.peleton3,
    members: members(3), gallery: gallery(3),
    support: 26500, status: "Verified", verified: true, createdAt: "2026-08-12"
  },
  {
    id: "4", slug: "smkn-2-nganjuk", number: "04",
    name: "SMKN 2 NGANJUK",
    school: "SMK Negeri 2 Nganjuk", city: "Nganjuk", province: "Jawa Timur", category: "SMA",
    description: "Teknik baris-berbaris yang presisi dipadukan dengan kreativitas formasi modern. Siap memberikan penampilan terbaik.",
    image: IMG.peleton4, cover: IMG.peleton4,
    members: members(4), gallery: gallery(4),
    support: 24100, status: "Verified", verified: true, createdAt: "2026-08-12"
  },
  {
    id: "5", slug: "smkn-1-nganjuk", number: "05",
    name: "SMKN 1 NGANJUK",
    school: "SMK Negeri 1 Nganjuk", city: "Nganjuk", province: "Jawa Timur", category: "SMA",
    description: "Kekuatan teknik dan kekompakan tim yang telah teruji di berbagai kejuaraan. Disiplin adalah nafas kami.",
    image: IMG.peleton5, cover: IMG.peleton5,
    members: members(5), gallery: gallery(5),
    support: 22300, status: "Verified", verified: true, createdAt: "2026-08-13"
  },
  {
    id: "6", slug: "sman-1-kertosono", number: "06",
    name: "SMAN 1 KERTOSONO",
    school: "SMA Negeri 1 Kertosono", city: "Kertosono", province: "Jawa Timur", category: "SMA",
    description: "Peleton kebanggaan Kertosono dengan tradisi juara yang kuat dan loyalitas tinggi.",
    image: IMG.peleton6, cover: IMG.peleton6,
    members: members(6), gallery: gallery(6),
    support: 20800, status: "Verified", verified: true, createdAt: "2026-08-14"
  },
  {
    id: "7", slug: "smpn-2-nganjuk", number: "07",
    name: "SMPN 2 NGANJUK",
    school: "SMP Negeri 2 Nganjuk", city: "Nganjuk", province: "Jawa Timur", category: "SMP",
    description: "Generasi penerus dengan semangat membara dan kekompakan yang patut diacungi jempol.",
    image: IMG.peleton7, cover: IMG.peleton7,
    members: members(7), gallery: gallery(7),
    support: 19200, status: "Verified", verified: true, createdAt: "2026-08-15"
  },
  {
    id: "8", slug: "mtsn-2-nganjuk", number: "08",
    name: "MTsN 2 NGANJUK",
    school: "MTs Negeri 2 Nganjuk", city: "Nganjuk", province: "Jawa Timur", category: "SMP",
    description: "Memadukan nilai kedisiplinan dengan kekompakan spiritual. Tampil dengan penuh percaya diri.",
    image: IMG.peleton8, cover: IMG.peleton8,
    members: members(8), gallery: gallery(8),
    support: 17600, status: "Verified", verified: true, createdAt: "2026-08-16"
  },
  {
    id: "9", slug: "smpn-1-kertosono", number: "09",
    name: "SMPN 1 KERTOSONO",
    school: "SMP Negeri 1 Kertosono", city: "Kertosono", province: "Jawa Timur", category: "SMP",
    description: "Peleton muda berbakat dengan latihan intensif dan dedikasi tinggi untuk mengharumkan nama sekolah.",
    image: IMG.peleton9, cover: IMG.peleton9,
    members: members(9), gallery: gallery(9),
    support: 16300, status: "Verified", verified: true, createdAt: "2026-08-17"
  },
  {
    id: "10", slug: "sman-2-nganjuk", number: "10",
    name: "SMAN 2 NGANJUK",
    school: "SMA Negeri 2 Nganjuk", city: "Nganjuk", province: "Jawa Timur", category: "SMA",
    description: "Kombinasi sempurna antara ketegasan, kekompakan, dan kreativitas formasi yang memukau.",
    image: IMG.peleton10, cover: IMG.peleton10,
    members: members(10), gallery: gallery(10),
    support: 15100, status: "Verified", verified: true, createdAt: "2026-08-18"
  },
  {
    id: "11", slug: "smkn-1-bagor", number: "11",
    name: "SMKN 1 BAGOR",
    school: "SMK Negeri 1 Bagor", city: "Bagor", province: "Jawa Timur", category: "SMA",
    description: "Peleton penuh semangat dengan yel-yel yang menggema dan kekompakan yang tak tergoyahkan.",
    image: IMG.peleton1, cover: IMG.peleton1,
    members: members(11), gallery: gallery(11),
    support: 14200, status: "Verified", verified: true, createdAt: "2026-08-19"
  },
  {
    id: "12", slug: "mtsn-1-nganjuk", number: "12",
    name: "MTsN 1 NGANJUK",
    school: "MTs Negeri 1 Nganjuk", city: "Nganjuk", province: "Jawa Timur", category: "SMP",
    description: "Menampilkan keanggunan gerakan yang presisi dengan sentuhan nilai religius yang kental.",
    image: IMG.peleton3, cover: IMG.peleton3,
    members: members(12), gallery: gallery(12),
    support: 13100, status: "Pending", verified: false, createdAt: "2026-08-20"
  },
]

export const judges: Judge[] = [
  {
    id: "j1", name: "Serka Aditya Gemy C.YK", role: "JURI PBB",
    bio: "Berpengalaman sebagai juri PBB di berbagai kompetisi tingkat regional dan nasional. Menekankan ketepatan gerakan dasar dan kedisiplinan.",
    photo: IMG.juri1
  },
  {
    id: "j2", name: "Aditya Rendy", role: "JURI PBB VARIASI & FORMASI",
    bio: "Spesialis variasi dan formasi. Menilai kreativitas, kekompakan, dan keindahan transisi formasi peleton.",
    photo: IMG.juri2
  },
  {
    id: "j3", name: "Andre Billy", role: "JURI PBB VARIASI DAN FORMASI",
    bio: "Praktisi baris-berbaris dengan jam terbang tinggi. Fokus pada inovasi gerakan dan harmonisasi tim.",
    photo: IMG.juri3
  },
]

export const sponsors: Sponsor[] = [
  { id: "s1", name: "ASTRA", tier: "Main Sponsor", logo: "ASTRA" },
  { id: "s2", name: "BRI", tier: "Official Partner", logo: "BRI" },
  { id: "s3", name: "Telkomsel", tier: "Official Partner", logo: "Telkomsel" },
  { id: "s4", name: "Indosat", tier: "Official Partner", logo: "Indosat Ooredoo" },
  { id: "s5", name: "Wardah", tier: "Supporting Partner", logo: "Wardah" },
  { id: "s6", name: "Hydro Coco", tier: "Supporting Partner", logo: "Hydro Coco" },
  { id: "s7", name: "Le Minerale", tier: "Supporting Partner", logo: "Le Minerale" },
  { id: "s8", name: "Kahf", tier: "Media Partner", logo: "Kahf" },
  { id: "s9", name: "Event Paskibra", tier: "Media Partner", logo: "Event Paskibra" },
]

export const news: NewsItem[] = [
  {
    id: "n1", slug: "persiapan-lkbb-2026-matang", title: "Persiapan LKBB Javasoma 2026 Semakin Matang", category: "Kompetisi", date: "2026-08-28",
    author: "Panitia LKBB", excerpt: "Gladi bersih dan verifikasi venue telah mencapai 90%. Panitia memastikan seluruh peleton mendapat fasilitas terbaik.",
    image: IMG.peleton5, content: "Persiapan LKBB Javasoma The Impression 2026 telah memasuki tahap akhir. Venue di SMKN 1 Kertosono telah disiapkan dengan standar kompetisi nasional. Seluruh peleton yang terverifikasi akan mendapatkan briefing teknis pada 3 Oktober 2026."
  },
  {
    id: "n2", slug: "tips-mendukung-peleton-favorit", title: "Cara Mendukung Peleton Favoritmu", category: "Panduan", date: "2026-08-25",
    author: "Panitia LKBB", excerpt: "Dukung peleton favorit dengan sistem ballot online yang mudah, aman, dan transparan.",
    image: IMG.peleton2, content: "Sistem dukungan peleton terfavorit menggunakan mekanisme ballot. Setiap ballot yang berhasil diverifikasi akan tercatat sebagai dukungan resmi dan mempengaruhi peringkat peleton."
  },
  {
    id: "n3", slug: "behind-the-scene-latihan", title: "Behind The Scene: Latihan Intensif Peleton", category: "Galeri", date: "2026-08-20",
    author: "Tim Media", excerpt: "Intip keseruan dan kerja keras peleton dalam mempersiapkan penampilan terbaik mereka.",
    image: IMG.peleton7, content: "Latihan intensif dilakukan setiap sore. Dedikasi dan kekompakan menjadi kunci utama setiap peleton untuk tampil maksimal di hari H."
  },
  {
    id: "n4", slug: "juri-kompeten-siaps", title: "Dewan Juri Kompeten Siap Menilai", category: "Juri", date: "2026-08-18",
    author: "Panitia LKBB", excerpt: "Tiga juri berpengalaman siap memberikan penilaian objektif dan profesional.",
    image: IMG.peleton1, content: "Dewan juri LKBB 2026 terdiri dari praktisi PBB terbaik yang telah berpengalaman menilai di tingkat nasional."
  },
]

export const announcements: Announcement[] = [
  { id: "a1", title: "Voting Peleton Terfavorit Resmi Dibuka", category: "Voting", date: "2026-09-01", content: "Voting peleton terfavorit telah dibuka mulai 1 September 2026. Dukung peleton favoritmu sekarang dan jadilah bagian dari perjalanan mereka." },
  { id: "a2", title: "Technical Meeting Wajib 3 Oktober 2026", category: "Schedule", date: "2026-08-30", content: "Seluruh perwakilan peleton wajib hadir pada Technical Meeting di Aula SMKN 1 Kertosono pukul 08.00 WIB." },
  { id: "a3", title: "Batas Kuota Pendaftaran Hampir Terpenuhi", category: "Important", date: "2026-08-28", content: "Sisa kuota SMP 2 tim dan SMA 3 tim. Segera daftarkan peletonmu sebelum kuota habis." },
  { id: "a4", title: "Panduan Pembayaran QRIS Terbaru", category: "Payment", date: "2026-08-25", content: "Pembayaran dukungan kini mendukung QRIS, transfer bank, dan e-wallet. Pastikan menyelesaikan pembayaran dalam 15 menit." },
]

export const faqs: FAQ[] = [
  { id: "f1", category: "Competition", question: "Apa itu LKBB Javasoma The Impression?", answer: "LKBB adalah Lomba Ketangkasan Baris-Berbaris tingkat SMP/MTs & SMA/MA/SMK se-derajat se-Jawa Timur yang diselenggarakan oleh Paskibra SMKN 1 Kertosono dengan tema ASTRA DHARMA HAYUNING BUDAYA." },
  { id: "f2", category: "Support", question: "Bagaimana cara mendukung peleton favorit?", answer: "Pilih peleton, tentukan jumlah dukungan (ballot), konfirmasi, dan selesaikan pembayaran via QRIS/transfer. Dukungan hanya tercatat setelah pembayaran berhasil." },
  { id: "f3", category: "Peleton", question: "Berapa jumlah anggota dalam satu peleton?", answer: "Satu peleton terdiri dari 16 anggota termasuk Danton dan Danru, sesuai regulasi LKBB 2026." },
  { id: "f4", category: "Payment", question: "Metode pembayaran apa yang tersedia?", answer: "Tersedia QRIS, transfer bank virtual account, dan e-wallet. Semua transaksi diproses aman dan tercatat otomatis." },
  { id: "f5", category: "Results", question: "Kapan pengumuman pemenang?", answer: "Pengumuman dilakukan setelah voting ditutup pada 24 Oktober 2026 dan melalui verifikasi panitia. Hasil final akan dipublikasikan di website dan media sosial resmi." },
  { id: "f6", category: "Technical", question: "Apakah bisa mendukung lebih dari satu peleton?", answer: "Ya, kamu dapat mendukung beberapa peleton berbeda. Setiap transaksi dukungan bersifat independen." },
  { id: "f7", category: "Competition", question: "Apa perbedaan kategori SMP dan SMA?", answer: "Kategori SMP/Sederajat dan SMA/Sederajat dinilai secara terpisah dengan ranking independen." },
  { id: "f8", category: "Support", question: "Apakah dukungan bisa dikembalikan?", answer: "Dukungan yang telah dibayar dan tercatat tidak dapat dikembalikan karena langsung mempengaruhi peringkat peleton." },
]

export const timelineStages: TimelineStage[] = [
  { id: "1", title: "Pendaftaran", date: "Agustus 2026", description: "Pendaftaran dibuka hingga kuota terpenuhi", status: "completed" },
  { id: "2", title: "Verifikasi", date: "September 2026", description: "Verifikasi berkas dan kelayakan peleton", status: "completed" },
  { id: "3", title: "Publikasi Peleton", date: "1 September 2026", description: "Peleton terverifikasi dipublikasikan", status: "current" },
  { id: "4", title: "Voting Dibuka", date: "1 September 2026", description: "Dukungan peleton terfavorit dibuka", status: "current" },
  { id: "5", title: "Technical Meeting", date: "3 Oktober 2026", description: "Briefing teknis seluruh peserta", status: "upcoming" },
  { id: "6", title: "Pelaksanaan Lomba", date: "24 Oktober 2026", description: "Hari pelaksanaan LKBB Javasoma", status: "upcoming" },
  { id: "7", title: "Verifikasi Hasil", date: "24-25 Oktober 2026", description: "Rekapitulasi online & offline", status: "upcoming" },
  { id: "8", title: "Pengumuman Pemenang", date: "26 Oktober 2026", description: "Publikasi hasil final & juara", status: "upcoming" },
]

export function getPeletonBySlug(slug: string) { return peletons.find(p=>p.slug===slug) }
export function getRankedPeletons(category?: "SMP"|"SMA") {
  const filtered = category ? peletons.filter(p=>p.category===category && p.verified) : peletons.filter(p=>p.verified)
  return [...filtered].sort((a,b)=> b.support - a.support)
}
