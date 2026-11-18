import type { Dictionary } from './en';

export const es: Dictionary = {
  'brand.name': 'PineReel',
  'brand.tagline': 'Inspector de enlaces sin anuncios y boveda sin conexion',

  'nav.skip': 'Ir al contenido',
  'nav.inspect': 'Analizar enlace',
  'nav.watch': 'Reproductor',
  'nav.vault': 'Boveda offline',
  'nav.ledger': 'Registro',
  'nav.deck': 'Presentacion',
  'nav.language': 'Idioma',
  'nav.theme': 'Apariencia',
  'nav.theme.system': 'Sistema',
  'nav.theme.light': 'Claro',
  'nav.theme.dark': 'Oscuro',
  'nav.menu': 'Menu',
  'nav.close': 'Cerrar',

  'badge.devnet': 'Devnet',
  'badge.kidModeOn': 'Modo infantil activo',
  'badge.kidModeOff': 'Filtro estandar',
  'badge.offline': 'Sin senal movil',
  'badge.online': 'En linea',

  'hero.kicker': 'SOLANA DEVNET · HIBRIDO LOCAL + NUBE',
  'hero.title.a': 'Mira cualquier enlace de video',
  'hero.title.b': 'sin anuncios ni trampas.',
  'hero.lead':
    'Pega un enlace de YouTube, X, Instagram, Vimeo o transmision directa. PineReel elimina rastreadores, bloquea apuestas y phishing, reproduce limpio y guarda videos para zonas de montana sin cobertura.',
  'hero.inputLabel': 'Enlace de video para analizar y reproducir',
  'hero.inputPlaceholder': 'https://www.youtube.com/watch?v=... o https://x.com/.../status/...',
  'hero.ctaInspect': 'Analizar y reproducir',
  'hero.ctaInspecting': 'Analizando enlace…',
  'hero.ctaVault': 'Abrir boveda offline',
  'hero.samplePrefix': 'Pruebas rapidas:',

  'shield.kicker': 'AISLAMIENTO EN CINCO CAPAS',
  'shield.title': 'Cada enlace se verifica antes de cargar un solo byte de video.',
  'shield.scoreLabel': 'Puntaje de seguridad',
  'shield.verdict.SAFE': 'Verificado seguro',
  'shield.verdict.CAUTION': 'Precaucion sugerida',
  'shield.verdict.BLOCKED': 'Amenaza bloqueada',
  'shield.kidSafeYes': 'Apto para ninos',
  'shield.kidSafeNo': 'Restringido en modo infantil',
  'shield.trackersRemoved': '{count} parametro(s) de rastreo eliminado(s)',
  'shield.hopsUnwrapped': '{count} salto(s) de redireccion abierto(s) en servidor',
  'shield.fingerprint': 'Huella de seguridad',

  'player.kicker': 'REPRODUCCION AISLADA Y ARCHIVO',
  'player.emptyTitle': 'Pega un enlace arriba para analizarlo y verlo',
  'player.emptyBody':
    'Cada enlace pasa por control SSRF, apertura de redirecciones y filtros contra apuestas o phishing antes de cargar.',
  'player.blockedTitle': 'Bloqueado antes de reproducir',
  'player.blockedBody':
    'PineReel detuvo este destino antes de cargar medios o scripts externos.',
  'player.kidBlockedTitle': 'Restringido por Modo Infantil',
  'player.kidBlockedBody':
    'Este video activo una alerta de contenido no familiar. Ingresa el PIN parental para desbloquearlo.',
  'player.saveVault': 'Guardar en boveda offline',
  'player.savingVault': 'Guardando ({progress})…',
  'player.savedVault': 'Guardado en boveda offline',
  'player.downloadMp4': 'Descargar MP4',
  'player.openWatch': 'Modo teatro',
  'player.speed': 'Velocidad',
  'player.anchorChain': 'Registrar prueba en Devnet',

  'vault.kicker': 'ALMACENAMIENTO PARA MONTANA SIN SENAL',
  'vault.title': 'Boveda multimedia offline',
  'vault.lead':
    'Los videos guardados permanecen en IndexedDB con suma SHA-256 y soporte Service Worker para reproducir sin senal en zonas altas.',
  'vault.emptyTitle': 'Tu boveda offline esta vacia',
  'vault.emptyBody':
    'Analiza un MP4 directo, Archive.org, video de X o flujo local yt-dlp y pulsa Guardar en boveda offline.',
  'vault.emptyCta': 'Probar un video seguro',
  'vault.storageUsed': 'Espacio usado',
  'vault.itemCount': '{count} video(s) sin conexion',
  'vault.playOffline': 'Reproducir offline',
  'vault.verifyHash': 'Verificar SHA-256',
  'vault.hashVerified': 'Integridad confirmada',
  'vault.hashMismatch': 'La suma no coincide',
  'vault.remove': 'Eliminar',
  'vault.guardianTitle': 'Control parental',
  'vault.pinLabel': 'Definir PIN de 4 a 8 digitos',
  'vault.pinSave': 'Activar PIN parental',
  'vault.pinUnlock': 'Desbloquear con PIN',
  'vault.pinLock': 'Bloquear modo infantil',
  'vault.mountainOnly': 'Bloqueo solo offline (ocultar enlaces externos)',

  'ledger.kicker': 'VERIFICACION SOLANA DEVNET',
  'ledger.title': 'Registro de seguridad on-chain',
  'ledger.lead':
    'Los recibos de seguridad pueden anclarse en Solana Devnet mediante el programa Memo para auditar hashes de videos limpios.',
  'ledger.walletConnect': 'Conectar wallet',
  'ledger.walletConnecting': 'Conectando…',
  'ledger.walletDisconnect': 'Desconectar',
  'ledger.walletNoExt': 'Wallet opcional',
  'ledger.slotLabel': 'Slot confirmado',
  'ledger.refresh': 'Actualizar Devnet',
  'ledger.txIdle': 'Listo para registrar',
  'ledger.txBuilding': 'Preparando transaccion…',
  'ledger.txSigning': 'Aprueba en tu wallet…',
  'ledger.txSent': 'Enviado a Devnet',
  'ledger.txConfirmed': 'Confirmado en Devnet',
  'ledger.txFinalized': 'Finalizado en Devnet',
  'ledger.viewExplorer': 'Ver en Explorer',
  'ledger.copyAddr': 'Copiar direccion',
  'ledger.copied': 'Copiado',
  'ledger.emptyTitle': 'Aun no hay registros Devnet',
  'ledger.emptyBody': 'Actualiza o conecta una wallet Devnet para revisar los recibos Memo en vivo.',

  'walkthrough.kicker': 'DEMO AUTOMATIZADA',
  'walkthrough.title': 'Flujo completo de seguridad y guardado offline en 40 segundos.',
  'walkthrough.lead':
    'Grabado desde produccion: limpieza de rastreadores, bloqueo de apuestas, guardado offline y verificacion en Devnet.',

  'how.kicker': 'ARQUITECTURA DEL SISTEMA',
  'how.title': 'Funciona tanto en local con yt-dlp como en despliegues serverless.',
  'how.step1Title': '1. Guardia de redirecciones y SSRF',
  'how.step1Body':
    'Los acortadores se siguen en servidor hasta 5 saltos verificando IPs privadas, punycode, apuestas y ejecutables.',
  'how.step2Title': '2. Motor dual de extraccion',
  'how.step2Body':
    'Detecta yt-dlp y ffmpeg locales automaticamente y usa extractores TypeScript puros en la nube para YouTube, X, Vimeo y Archive.',
  'how.step3Title': '3. Boveda IndexedDB y recibos Devnet',
  'how.step3Body':
    'Los flujos directos se almacenan con firma SHA-256 para uso sin senal y registro verificable en Solana Devnet.',

  'deck.kicker': 'ARQUITECTURA Y HOJA DE RUTA',
  'deck.title': 'Presentacion PineReel',
  'deck.lead': 'Diagnostico, defensa de cinco capas, motor de medios en tres niveles y confianza en Solana Devnet.',

  'footer.note': 'PineReel funciona sin anuncios, analitica conductual ni rastreadores de terceros.',
};

