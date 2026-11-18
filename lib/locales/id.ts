import type { Dictionary } from './en';

export const id: Dictionary = {
  'brand.name': 'PineReel',
  'brand.tagline': 'Pemeriksa tautan bebas iklan dan brankas video offline pegunungan',

  'nav.skip': 'Langsung ke konten',
  'nav.inspect': 'Periksa Link',
  'nav.watch': 'Pemutar',
  'nav.vault': 'Brankas Offline',
  'nav.ledger': 'Buku Keamanan',
  'nav.deck': 'Presentasi',
  'nav.language': 'Bahasa',
  'nav.theme': 'Tampilan',
  'nav.theme.system': 'Sistem',
  'nav.theme.light': 'Terang',
  'nav.theme.dark': 'Gelap',
  'nav.menu': 'Menu',
  'nav.close': 'Tutup',

  'badge.devnet': 'Devnet',
  'badge.kidModeOn': 'Kunci Ramah Anak Aktif',
  'badge.kidModeOff': 'Filter Standar',
  'badge.offline': 'Mode Tanpa Sinyal',
  'badge.online': 'Terhubung',

  'hero.kicker': 'SOLANA DEVNET · HYBRID LOKAL + CLOUD',
  'hero.title.a': 'Tonton link video apa pun',
  'hero.title.b': 'tanpa iklan dan jebakan.',
  'hero.lead':
    'Tempel tautan dari YouTube, X, Instagram, Vimeo, atau stream langsung. PineReel menghapus pelacak, memblokir iklan judol dan phishing, memutar bersih, dan menyimpan video offline untuk wilayah pegunungan tanpa sinyal.',
  'hero.inputLabel': 'Tautan video untuk diperiksa dan diputar',
  'hero.inputPlaceholder': 'https://www.youtube.com/watch?v=... atau https://x.com/.../status/...',
  'hero.ctaInspect': 'Periksa & Putar',
  'hero.ctaInspecting': 'Memeriksa tautan…',
  'hero.ctaVault': 'Buka Brankas Offline',
  'hero.samplePrefix': 'Tautan uji cepat:',

  'shield.kicker': 'ISOLASI TAUTAN LIMA LAPIS',
  'shield.title': 'Setiap tautan diperiksa sebelum satu byte video pun dimuat.',
  'shield.scoreLabel': 'Skor keamanan',
  'shield.verdict.SAFE': 'Terverifikasi Aman',
  'shield.verdict.CAUTION': 'Perlu Perhatian',
  'shield.verdict.BLOCKED': 'Ancaman Diblokir',
  'shield.kidSafeYes': 'Aman untuk Anak',
  'shield.kidSafeNo': 'Dibatasi di Mode Anak',
  'shield.trackersRemoved': '{count} parameter pelacak dihapus',
  'shield.hopsUnwrapped': '{count} lompatan redirect dibuka di server',
  'shield.fingerprint': 'Sidik jari keamanan',

  'player.kicker': 'PEMUTARAN TERISOLASI DAN ARSIP',
  'player.emptyTitle': 'Tempel tautan di atas untuk memeriksa dan menonton',
  'player.emptyBody':
    'Setiap tautan melewati validasi SSRF, pembukaan redirect, dan penyaringan pola judol atau phishing sebelum pemutar dimuat.',
  'player.blockedTitle': 'Diblokir sebelum pemutaran',
  'player.blockedBody':
    'PineReel menghentikan tujuan ini sebelum aliran media atau skrip eksternal dapat berjalan.',
  'player.kidBlockedTitle': 'Dibatasi oleh Kunci Ramah Anak',
  'player.kidBlockedBody':
    'Video ini memicu tanda peringatan atau batas usia saat Mode Anak aktif. Masukkan PIN Wali untuk membuka sementara.',
  'player.saveVault': 'Simpan ke Brankas Offline',
  'player.savingVault': 'Menyimpan ke Brankas ({progress})…',
  'player.savedVault': 'Tersimpan di Brankas Offline',
  'player.downloadMp4': 'Unduh MP4',
  'player.openWatch': 'Mode Teater',
  'player.speed': 'Kecepatan putar',
  'player.anchorChain': 'Catat Bukti di Devnet',

  'vault.kicker': 'PENYIMPANAN PEGUNUNGAN TANPA SINYAL',
  'vault.title': 'Brankas Media Offline',
  'vault.lead':
    'Video yang disimpan bertahan di IndexedDB browser dengan verifikasi SHA-256 dan routing offline Service Worker, siap ditonton saat sinyal seluler nol.',
  'vault.emptyTitle': 'Brankas Offline masih kosong',
  'vault.emptyBody':
    'Periksa stream MP4 langsung, Archive.org, video X, atau stream yt-dlp lokal lalu tekan Simpan ke Brankas Offline.',
  'vault.emptyCta': 'Uji satu video aman',
  'vault.storageUsed': 'Penyimpanan terpakai',
  'vault.itemCount': '{count} video offline',
  'vault.playOffline': 'Putar Offline',
  'vault.verifyHash': 'Verifikasi SHA-256',
  'vault.hashVerified': 'Integritas terverifikasi',
  'vault.hashMismatch': 'Checksum tidak cocok',
  'vault.remove': 'Hapus',
  'vault.guardianTitle': 'Kontrol Wali',
  'vault.pinLabel': 'Atur PIN Wali 4 hingga 8 digit',
  'vault.pinSave': 'Aktifkan PIN Wali',
  'vault.pinUnlock': 'Buka dengan PIN',
  'vault.pinLock': 'Kunci Mode Anak',
  'vault.mountainOnly': 'Kunci Khusus Offline Pegunungan (sembunyikan input tautan luar)',

  'ledger.kicker': 'VERIFIKASI SOLANA DEVNET',
  'ledger.title': 'Buku Bukti Keamanan On-Chain',
  'ledger.lead':
    'Setiap tanda terima pemeriksaan tautan dan arsip offline dapat dicatat ke Solana Devnet lewat program Memo agar keluarga dan sekolah dapat memverifikasi hash media secara terbuka.',
  'ledger.walletConnect': 'Hubungkan Wallet',
  'ledger.walletConnecting': 'Menghubungkan…',
  'ledger.walletDisconnect': 'Putuskan',
  'ledger.walletNoExt': 'Wallet browser opsional',
  'ledger.slotLabel': 'Slot terkonfirmasi',
  'ledger.refresh': 'Segarkan Devnet',
  'ledger.txIdle': 'Siap mencatat bukti',
  'ledger.txBuilding': 'Menyiapkan transaksi…',
  'ledger.txSigning': 'Setujui di wallet Anda…',
  'ledger.txSent': 'Terkirim ke Devnet',
  'ledger.txConfirmed': 'Terkonfirmasi di Devnet',
  'ledger.txFinalized': 'Final di Devnet',
  'ledger.viewExplorer': 'Lihat di Explorer',
  'ledger.copyAddr': 'Salin alamat',
  'ledger.copied': 'Disalin',
  'ledger.emptyTitle': 'Belum ada bukti Devnet yang dimuat',
  'ledger.emptyBody': 'Segarkan atau hubungkan wallet Devnet untuk memeriksa catatan Memo langsung di jaringan.',

  'walkthrough.kicker': 'DEMO PRODUK OTOMATIS',
  'walkthrough.title': 'Lihat alur keamanan dan mode offline lengkap dalam 40 detik.',
  'walkthrough.lead':
    'Direkam langsung dari build produksi: memeriksa tautan berpelacak, memblokir umpan judol, menyimpan video offline, dan memverifikasi catatan Devnet.',

  'how.kicker': 'ARSITEKTUR SISTEM',
  'how.title': 'Berjalan mulus baik secara lokal dengan yt-dlp maupun di cloud serverless.',
  'how.step1Title': '1. Penjaga redirect dan SSRF di server',
  'how.step1Body':
    'Tautan pendek dibuka hingga 5 lompatan dengan pemeriksaan IP privat, punycode, judol, dan file eksekusi sebelum pemutar tampil.',
  'how.step2Title': '2. Pipeline ekstraksi ganda',
  'how.step2Body':
    'Memakai yt-dlp dan ffmpeg lokal secara otomatis bila tersedia, dan beralih ke ekstraktor TypeScript murni untuk YouTube, X, Vimeo, Archive, dan stream langsung di cloud.',
  'how.step3Title': '3. Brankas IndexedDB dan bukti Devnet',
  'how.step3Body':
    'Aliran langsung ditulis ke IndexedDB beserta hash SHA-256 untuk pemutaran tanpa sinyal, dengan opsi pencatatan di Solana Devnet.',

  'deck.kicker': 'ARSITEKTUR DAN PETA JALAN',
  'deck.title': 'Dek Produk PineReel',
  'deck.lead': 'Diagnosis masalah, arsitektur perlindungan 5 lapis, mesin media 3 tingkat, dan model kepercayaan Solana Devnet.',

  'footer.note': 'PineReel berjalan tanpa iklan, analitik perilaku, atau pelacak pihak ketiga.',
};

