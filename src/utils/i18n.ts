export type Locale = 'id' | 'en';

export interface Translations {
  skipToMain: string;
  subtitle: string;
  pickedCount: (count: number) => string;
  closeNotification: string;
  languageSwitchAria: string;
  footerDisclaimer: string;

  // SpinWheel
  unitCountSuffix: string;
  spinFull: string;
  spinEmpty: string;
  respinSlotLabel: string;
  cancelRespinAria: string;
  wheelAria: (categoryLabel: string) => string;
  emptyWheelSlotFull: string;
  emptyWheelNoUnits: string;
  emptyWheelHint: string;
  spinButtonAria: string;

  // SettingsPanel
  settingsTitle: string;
  reset: string;
  categoryLabel: string;
  thLimits: string;
  antiDuplicate: string;
  muteSoundAria: string;
  unmuteSoundAria: string;
  volumeAria: string;

  // FilterPanel
  filterTitle: string;
  resetFilter: string;
  unitRoles: string;
  activeRolesCount: (count: number) => string;
  matchLabel: string;
  movementAll: string;
  relevantOnly: string;
  relevantEquipActivePrefix: string;
  relevantEquipAll: string;
  relevantEquipAutoHint: string;
  relevantHeroActivePrefix: string;
  relevantHeroAll: string;
  relevantHeroAutoHint: string;
  toggleRelevanceAria: string;
  ccDonationTitle: string;
  ccDonationOnDesc: string;
  ccDonationOffDesc: string;
  toggleCcSiegeAria: string;
  petsInfo: string;
  spellsInfo: string;
  emptyNoRoleMatch: string;
  emptyAllHeroesEquipped: string;
  emptyNoRelevantHeroes: string;
  emptySlotFull: (used: number, max: number | null, th: number) => string;
  emptyAllPicked: string;
  emptyUnavailable: string;
  actionResetRoleFilter: string;
  actionContinueSpinHero: string;
  actionDisableRelevance: string;
  actionDisableRelevanceFillHeroes: string;
  actionDisableThLimits: string;
  actionDisableAntiDuplicate: string;

  // RevealBanner
  replacingItem: (name: string) => string;
  lastSpinResult: string;
  respinThisSlot: string;
  closeResultBannerAria: string;

  // LoadoutPanel & ExportCard
  generatingPng: string;
  copied: string;
  copyText: string;
  clearUnlockedTitle: string;
  emptyLoadoutTitle: string;
  emptyLoadoutBeforeSpin: string;
  emptyLoadoutAfterSpin: string;
  respinHeroTitle: string;
  unlockHeroTitle: string;
  lockHeroTitle: string;
  removeHeroTitle: string;
  respinEquipTitle: string;
  unlockTitle: string;
  lockEquipTitle: string;
  removeEquipTitle: string;
  addEquipSlot: string;
  respinPetTitle: string;
  unlockPetTitle: string;
  lockPetTitle: string;
  removePetTitle: string;
  addPetSlot: string;
  reserveEquipment: string;
  reservePets: string;
  lockTitle: string;
  removeTitle: string;
  allRolesTitle: (roles: string) => string;
  toastCopied: string;
  toastCopyFailed: string;
  toastPngSuccess: string;
  toastPngFailed: string;

  // Export formatter
  exportUnpairedEquipment: string;
  exportReservePets: string;

  // Store toasts
  toastThLowered: (th: number, preview: string) => string;
  toastMoreItems: (count: number) => string;
  toastWorkshopOnly: (removed: string) => string;
  toastNoRespinCandidate: string;
}

export const TRANSLATIONS: Record<Locale, Translations> = {
  id: {
    skipToMain: 'Langsung ke konten utama',
    subtitle: 'Clash of Clans Loadout Spinner per Town Hall',
    pickedCount: (count) => `${count} terpilih`,
    closeNotification: 'Tutup notifikasi',
    languageSwitchAria: 'Pilih bahasa',
    footerDisclaimer:
      'Konten ini tidak berafiliasi dengan, didukung, disponsori, atau disetujui secara khusus oleh Supercell.',

    unitCountSuffix: 'unit',
    spinFull: 'PENUH',
    spinEmpty: 'KOSONG',
    respinSlotLabel: 'Re-spin slot:',
    cancelRespinAria: 'Batalkan re-spin',
    wheelAria: (categoryLabel) => `Roda spin Clash of Clans kategori ${categoryLabel}`,
    emptyWheelSlotFull: 'Slot Kategori Sudah Penuh',
    emptyWheelNoUnits: 'Tidak Ada Unit di Roda',
    emptyWheelHint: 'Gunakan tombol pemulihan di panel filter',
    spinButtonAria: 'Putar roda spin',

    settingsTitle: 'Pengaturan',
    reset: 'Reset',
    categoryLabel: 'Kategori',
    thLimits: 'Batas TH',
    antiDuplicate: 'Anti-Duplikat',
    muteSoundAria: 'Matikan suara',
    unmuteSoundAria: 'Nyalakan suara',
    volumeAria: 'Volume suara spin',

    filterTitle: 'Filter',
    resetFilter: 'Reset Filter',
    unitRoles: 'Role unit',
    activeRolesCount: (count) => `${count} aktif`,
    matchLabel: 'Cocokkan:',
    movementAll: 'Semua',
    relevantOnly: 'Hanya Relevan',
    relevantEquipActivePrefix: 'Khusus equipment milik:',
    relevantEquipAll: 'Menampilkan semua equipment yang tersedia di TH ini.',
    relevantEquipAutoHint: 'Aktif otomatis setelah kamu memilih Hero.',
    relevantHeroActivePrefix: 'Khusus Hero pemilik equipment cadangan:',
    relevantHeroAll: 'Menampilkan semua Hero yang tersedia di TH ini.',
    relevantHeroAutoHint: 'Aktif otomatis jika ada equipment cadangan di loadout.',
    toggleRelevanceAria: 'Toggle filter hanya relevan Hero dan Equipment',
    ccDonationTitle: 'Donasi Clan Castle',
    ccDonationOnDesc: 'Menampilkan semua Siege Machine dari donasi Clan Castle.',
    ccDonationOffDesc: 'Hanya Siege Machine yang terbuka di Siege Workshop.',
    toggleCcSiegeAria: 'Toggle Siege Machine donasi Clan Castle TH10+',
    petsInfo: 'Pet otomatis dipasangkan ke Hero yang masih memiliki slot kosong.',
    spellsInfo: 'Semua Elixir dan Dark Spell yang tersedia di TH ini ditampilkan di roda.',
    emptyNoRoleMatch: 'Tidak ada unit yang cocok dengan kombinasi filter saat ini.',
    emptyAllHeroesEquipped: 'Semua Hero terpilih sudah memiliki 2/2 Equipment.',
    emptyNoRelevantHeroes: 'Semua Hero yang cocok dengan Equipment sudah terpilih.',
    emptySlotFull: (used, max, th) =>
      `Batas slot kategori ini sudah penuh (${used}/${max} di TH${th}).`,
    emptyAllPicked: 'Semua unit di pool ini sudah masuk loadout.',
    emptyUnavailable: 'Kategori belum terbuka untuk pengaturan TH saat ini.',
    actionResetRoleFilter: 'Reset Filter Role',
    actionContinueSpinHero: 'Lanjut Spin Hero',
    actionDisableRelevance: 'Matikan Filter Relevan',
    actionDisableRelevanceFillHeroes: 'Matikan Filter Relevan & Lanjut Isi Sisa Hero',
    actionDisableThLimits: 'Matikan Batas Realistis TH',
    actionDisableAntiDuplicate: 'Matikan Anti-Duplikat',

    replacingItem: (name) => `Mengganti ${name}`,
    lastSpinResult: 'Hasil Spin Terakhir',
    respinThisSlot: 'Re-spin slot ini',
    closeResultBannerAria: 'Tutup banner hasil',

    generatingPng: 'Membuat PNG...',
    copied: 'Tersalin!',
    copyText: 'Copy Teks',
    clearUnlockedTitle: 'Hapus semua slot yang tidak dikunci',
    emptyLoadoutTitle: 'Belum ada unit terpilih',
    emptyLoadoutBeforeSpin: 'Klik',
    emptyLoadoutAfterSpin: 'pada roda untuk mulai menyusun loadout.',
    respinHeroTitle: 'Re-spin Hero ini',
    unlockHeroTitle: 'Buka kunci Hero',
    lockHeroTitle: 'Kunci Hero',
    removeHeroTitle: 'Hapus Hero ini',
    respinEquipTitle: 'Re-spin equipment ini',
    unlockTitle: 'Buka kunci',
    lockEquipTitle: 'Kunci equipment',
    removeEquipTitle: 'Hapus equipment',
    addEquipSlot: '+ Slot Equip',
    respinPetTitle: 'Re-spin Pet ini',
    unlockPetTitle: 'Buka kunci Pet',
    lockPetTitle: 'Kunci Pet',
    removePetTitle: 'Hapus Pet',
    addPetSlot: '+ Slot Pet',
    reserveEquipment: 'Equipment Cadangan',
    reservePets: 'Pets Cadangan',
    lockTitle: 'Kunci',
    removeTitle: 'Hapus',
    allRolesTitle: (roles) => `Semua role: ${roles}`,
    toastCopied: 'Loadout berhasil disalin ke clipboard (siap paste ke WA/Discord)!',
    toastCopyFailed: 'Gagal menyalin otomatis — pastikan izin clipboard browser aktif.',
    toastPngSuccess: 'Kartu loadout PNG berhasil diunduh!',
    toastPngFailed: 'Gagal membuat gambar PNG. Coba lagi.',

    exportUnpairedEquipment: 'Equipment (Belum terpasang)',
    exportReservePets: 'Pets (Cadangan)',

    toastThLowered: (th, preview) => `TH diturunkan ke TH${th} — dihapus: ${preview}`,
    toastMoreItems: (count) => `(+${count} lainnya)`,
    toastWorkshopOnly: (removed) => `Siege Workshop saja — dihapus: ${removed}`,
    toastNoRespinCandidate: 'Tidak ada kandidat lain yang tersedia untuk di-re-spin pada slot ini.',
  },
  en: {
    skipToMain: 'Skip to main content',
    subtitle: 'Clash of Clans Loadout Spinner by Town Hall',
    pickedCount: (count) => `${count} picked`,
    closeNotification: 'Close notification',
    languageSwitchAria: 'Select language',
    footerDisclaimer:
      'This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell.',

    unitCountSuffix: 'units',
    spinFull: 'FULL',
    spinEmpty: 'EMPTY',
    respinSlotLabel: 'Re-spin slot:',
    cancelRespinAria: 'Cancel re-spin',
    wheelAria: (categoryLabel) => `Clash of Clans spin wheel for ${categoryLabel}`,
    emptyWheelSlotFull: 'Category Slots Full',
    emptyWheelNoUnits: 'No Units on Wheel',
    emptyWheelHint: 'Use a recovery action in the filter panel',
    spinButtonAria: 'Spin the wheel',

    settingsTitle: 'Settings',
    reset: 'Reset',
    categoryLabel: 'Category',
    thLimits: 'TH Limits',
    antiDuplicate: 'No Duplicates',
    muteSoundAria: 'Mute sound',
    unmuteSoundAria: 'Unmute sound',
    volumeAria: 'Spin sound volume',

    filterTitle: 'Filter',
    resetFilter: 'Reset Filter',
    unitRoles: 'Unit roles',
    activeRolesCount: (count) => `${count} active`,
    matchLabel: 'Match:',
    movementAll: 'All',
    relevantOnly: 'Relevant Only',
    relevantEquipActivePrefix: 'Only equipment for:',
    relevantEquipAll: 'Showing all equipment available at this TH.',
    relevantEquipAutoHint: 'Enables automatically after you pick a Hero.',
    relevantHeroActivePrefix: 'Only Heroes matching reserve equipment:',
    relevantHeroAll: 'Showing all Heroes available at this TH.',
    relevantHeroAutoHint: 'Enables automatically when reserve equipment is in the loadout.',
    toggleRelevanceAria: 'Toggle Hero and Equipment relevance filter',
    ccDonationTitle: 'Clan Castle Donation',
    ccDonationOnDesc: 'Showing all Siege Machines available via Clan Castle donation.',
    ccDonationOffDesc: 'Only Siege Machines unlocked in the Siege Workshop.',
    toggleCcSiegeAria: 'Toggle TH10+ Clan Castle Siege Machine donation',
    petsInfo: 'Pets are automatically paired to Heroes with an open slot.',
    spellsInfo: 'All Elixir and Dark Spells available at this TH are shown on the wheel.',
    emptyNoRoleMatch: 'No units match the current filter combination.',
    emptyAllHeroesEquipped: 'All picked Heroes already have 2/2 Equipment.',
    emptyNoRelevantHeroes: 'All Heroes matching your Equipment are already picked.',
    emptySlotFull: (used, max, th) =>
      `This category has reached its slot limit (${used}/${max} at TH${th}).`,
    emptyAllPicked: 'All units in this pool are already in your loadout.',
    emptyUnavailable: 'This category is not unlocked for the current TH setting.',
    actionResetRoleFilter: 'Reset Role Filter',
    actionContinueSpinHero: 'Spin Hero Next',
    actionDisableRelevance: 'Turn Off Relevant Filter',
    actionDisableRelevanceFillHeroes: 'Turn Off Relevant Filter & Fill Remaining Heroes',
    actionDisableThLimits: 'Turn Off Realistic TH Limits',
    actionDisableAntiDuplicate: 'Turn Off No Duplicates',

    replacingItem: (name) => `Replacing ${name}`,
    lastSpinResult: 'Last Spin Result',
    respinThisSlot: 'Re-spin this slot',
    closeResultBannerAria: 'Close result banner',

    generatingPng: 'Generating PNG...',
    copied: 'Copied!',
    copyText: 'Copy Text',
    clearUnlockedTitle: 'Remove all unlocked slots',
    emptyLoadoutTitle: 'No units picked yet',
    emptyLoadoutBeforeSpin: 'Click',
    emptyLoadoutAfterSpin: 'on the wheel to start building your loadout.',
    respinHeroTitle: 'Re-spin this Hero',
    unlockHeroTitle: 'Unlock Hero',
    lockHeroTitle: 'Lock Hero',
    removeHeroTitle: 'Remove this Hero',
    respinEquipTitle: 'Re-spin this equipment',
    unlockTitle: 'Unlock',
    lockEquipTitle: 'Lock equipment',
    removeEquipTitle: 'Remove equipment',
    addEquipSlot: '+ Equip Slot',
    respinPetTitle: 'Re-spin this Pet',
    unlockPetTitle: 'Unlock Pet',
    lockPetTitle: 'Lock Pet',
    removePetTitle: 'Remove Pet',
    addPetSlot: '+ Pet Slot',
    reserveEquipment: 'Reserve Equipment',
    reservePets: 'Reserve Pets',
    lockTitle: 'Lock',
    removeTitle: 'Remove',
    allRolesTitle: (roles) => `All roles: ${roles}`,
    toastCopied: 'Loadout copied to clipboard (ready to paste to WA/Discord)!',
    toastCopyFailed: 'Could not copy automatically — make sure clipboard permission is enabled.',
    toastPngSuccess: 'Loadout PNG card downloaded!',
    toastPngFailed: 'Failed to generate PNG image. Please try again.',

    exportUnpairedEquipment: 'Equipment (Unpaired)',
    exportReservePets: 'Pets (Reserve)',

    toastThLowered: (th, preview) => `TH lowered to TH${th} — removed: ${preview}`,
    toastMoreItems: (count) => `(+${count} more)`,
    toastWorkshopOnly: (removed) => `Siege Workshop only — removed: ${removed}`,
    toastNoRespinCandidate: 'No other candidates available to re-spin for this slot.',
  },
};
