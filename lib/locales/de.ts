import type { Dictionary } from './en';

export const de: Dictionary = {
  'brand.name': 'PineReel',
  'brand.tagline': 'Werbefreier Link-Pruefer und Offline-Medienspeicher',

  'nav.skip': 'Zum Inhalt springen',
  'nav.inspect': 'Link pruefen',
  'nav.watch': 'Player',
  'nav.vault': 'Offline-Tresor',
  'nav.ledger': 'Pruefregister',
  'nav.deck': 'Ueberblick',
  'nav.language': 'Sprache',
  'nav.theme': 'Darstellung',
  'nav.theme.system': 'System',
  'nav.theme.light': 'Hell',
  'nav.theme.dark': 'Dunkel',
  'nav.menu': 'Menue',
  'nav.close': 'Schliessen',

  'badge.devnet': 'Devnet',
  'badge.kidModeOn': 'Kinderschutz aktiv',
  'badge.kidModeOff': 'Standardfilter',
  'badge.offline': 'Kein Netzsignal',
  'badge.online': 'Verbunden',

  'hero.kicker': 'SOLANA DEVNET · LOKAL + CLOUD HYBRID',
  'hero.title.a': 'Jeden Videolink ansehen',
  'hero.title.b': 'ohne Werbung oder Fallen.',
  'hero.lead':
    'Fuegen Sie einen Link von YouTube, X, Instagram, Vimeo oder einen direkten Stream ein. PineReel entfernt Tracking-Parameter, blockiert Gluecksspiel- und Phishing-Koeder und speichert Videos fuer funklose Bergregionen offline.',
  'hero.inputLabel': 'Videolink zum Pruefen und Abspielen',
  'hero.inputPlaceholder': 'https://www.youtube.com/watch?v=... oder https://x.com/.../status/...',
  'hero.ctaInspect': 'Pruefen & Abspielen',
  'hero.ctaInspecting': 'Link wird geprueft…',
  'hero.ctaVault': 'Offline-Tresor oeffnen',
  'hero.samplePrefix': 'Schnelltests:',

  'shield.kicker': 'FUENFSCHICHTIGE LINK-ISOLATION',
  'shield.title': 'Jeder Link wird geprueft, bevor ein einziges Video-Byte geladen wird.',
  'shield.scoreLabel': 'Sicherheitswert',
  'shield.verdict.SAFE': 'Geprueft sicher',
  'shield.verdict.CAUTION': 'Hinweis beachten',
  'shield.verdict.BLOCKED': 'Bedrohung blockiert',
  'shield.kidSafeYes': 'Fuer Kinder geeignet',
  'shield.kidSafeNo': 'Im Kindermodus gesperrt',
  'shield.trackersRemoved': '{count} Tracking-Parameter entfernt',
  'shield.hopsUnwrapped': '{count} Weiterleitung(en) serverseitig aufgeloest',
  'shield.fingerprint': 'Pruefsumme',

  'player.kicker': 'ISOLIERTE WIEDERGABE UND ARCHIV',
  'player.emptyTitle': 'Link oben einfuegen, um zu pruefen und abzuspielen',
  'player.emptyBody':
    'Jede URL durchlaeuft SSRF-Schutz, Weiterleitungspruefung sowie Gluecksspiel- und Phishing-Filter, bevor der Player startet.',
  'player.blockedTitle': 'Vor dem Laden blockiert',
  'player.blockedBody':
    'PineReel hat dieses Ziel gestoppt, bevor Videodaten oder fremde Skripte ausgefuehrt werden konnten.',
  'player.kidBlockedTitle': 'Durch Kinderschutz gesperrt',
  'player.kidBlockedBody':
    'Dieses Video wurde als nicht familientauglich markiert. Geben Sie die Eltern-PIN ein, um es freizugeben.',
  'player.saveVault': 'In Offline-Tresor sichern',
  'player.savingVault': 'Wird gesichert ({progress})…',
  'player.savedVault': 'Im Offline-Tresor gesichert',
  'player.downloadMp4': 'MP4 herunterladen',
  'player.openWatch': 'Kinoansicht',
  'player.speed': 'Geschwindigkeit',
  'player.anchorChain': 'Nachweis auf Devnet verankern',

  'vault.kicker': 'SPEICHER FUER GEBIETE OHNE EMPFANG',
  'vault.title': 'Offline-Medientresor',
  'vault.lead':
    'Gesicherte Videos bleiben lokal in IndexedDB mit SHA-256-Pruefsumme und Service-Worker-Routing fuer Bergtouren ohne Mobilfunk.',
  'vault.emptyTitle': 'Ihr Offline-Tresor ist leer',
  'vault.emptyBody':
    'Pruefen Sie ein direktes MP4, Archive.org, ein X-Video oder einen lokalen yt-dlp-Stream und klicken Sie auf Sichern.',
  'vault.emptyCta': 'Beispielvideo pruefen',
  'vault.storageUsed': 'Belegter Speicher',
  'vault.itemCount': '{count} Offline-Video(s)',
  'vault.playOffline': 'Offline abspielen',
  'vault.verifyHash': 'SHA-256 pruefen',
  'vault.hashVerified': 'Integritaet bestaetigt',
  'vault.hashMismatch': 'Pruefsumme weicht ab',
  'vault.remove': 'Entfernen',
  'vault.guardianTitle': 'Elternsteuerung',
  'vault.pinLabel': 'Eltern-PIN mit 4 bis 8 Ziffern festlegen',
  'vault.pinSave': 'Eltern-PIN aktivieren',
  'vault.pinUnlock': 'Mit PIN entsperren',
  'vault.pinLock': 'Kindermodus sperren',
  'vault.mountainOnly': 'Nur-Offline-Sperre (externe Eingabe ausblenden)',

  'ledger.kicker': 'SOLANA DEVNET VERIFIKATION',
  'ledger.title': 'On-Chain Sicherheitsregister',
  'ledger.lead':
    'Gepruefte Medien-Hashes koennen ueber das Memo-Programm auf Solana Devnet verankert werden, damit Familien saubere Quellen nachvollziehen koennen.',
  'ledger.walletConnect': 'Wallet verbinden',
  'ledger.walletConnecting': 'Verbinde…',
  'ledger.walletDisconnect': 'Trennen',
  'ledger.walletNoExt': 'Browser-Wallet optional',
  'ledger.slotLabel': 'Bestaetigter Slot',
  'ledger.refresh': 'Devnet aktualisieren',
  'ledger.txIdle': 'Bereit fuer Eintrag',
  'ledger.txBuilding': 'Transaktion wird erstellt…',
  'ledger.txSigning': 'In Wallet bestaetigen…',
  'ledger.txSent': 'An Devnet gesendet',
  'ledger.txConfirmed': 'Auf Devnet bestaetigt',
  'ledger.txFinalized': 'Auf Devnet finalisiert',
  'ledger.viewExplorer': 'Im Explorer ansehen',
  'ledger.copyAddr': 'Adresse kopieren',
  'ledger.copied': 'Kopiert',
  'ledger.emptyTitle': 'Noch keine Devnet-Eintraege geladen',
  'ledger.emptyBody': 'Aktualisieren Sie die Ansicht oder verbinden Sie ein Devnet-Wallet.',

  'walkthrough.kicker': 'AUTOMATISIERTE PRODUKTDEMO',
  'walkthrough.title': 'Der komplette Sicherheits- und Offline-Ablauf in 40 Sekunden.',
  'walkthrough.lead':
    'Direkt vom Produktions-Build aufgenommen: Tracking entfernen, Koeder blockieren, Video offline sichern und Devnet-Nachweis pruefen.',

  'how.kicker': 'SYSTEMARCHITEKTUR',
  'how.title': 'Lauffaehig lokal mit yt-dlp sowie nahtlos in der Serverless-Cloud.',
  'how.step1Title': '1. Serverseitiger Weiterleitungs- und SSRF-Schutz',
  'how.step1Body':
    'Kurzlinks werden ueber bis zu 5 Stationen auf private IPs, Punycode, Gluecksspiel-Muster und ausfuehrbare Dateien geprueft.',
  'how.step2Title': '2. Doppelte Extraktions-Pipeline',
  'how.step2Body':
    'Nutzt lokal automatisch yt-dlp und ffmpeg und schaltet in der Cloud auf reine TypeScript-Extraktoren fuer YouTube, X, Vimeo und Archive um.',
  'how.step3Title': '3. IndexedDB-Tresor und Devnet-Belege',
  'how.step3Body':
    'Direkte Streams landen mit SHA-256-Hash im Browser-Tresor fuer funklose Wiedergabe und optionale Devnet-Protokollierung.',

  'deck.kicker': 'ARCHITEKTUR UND ROADMAP',
  'deck.title': 'PineReel Produktdeck',
  'deck.lead': 'Problemanalyse, Fuenf-Schichten-Schutz, dreistufige Medien-Engine und Solana-Devnet-Vertrauensmodell.',

  'footer.note': 'PineReel arbeitet ohne Werbung, Nutzungsprofile oder Tracking-Skripte.',
};

