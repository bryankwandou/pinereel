import type { Dictionary } from './en';

export const ja: Dictionary = {
  'brand.name': 'PineReel',
  'brand.tagline': '広告なし動画リンク検査とオフライン保管庫',

  'nav.skip': '本文へ移動',
  'nav.inspect': 'リンク検査',
  'nav.watch': 'プレーヤー',
  'nav.vault': 'オフライン庫',
  'nav.ledger': '安全台帳',
  'nav.deck': '資料',
  'nav.language': '言語',
  'nav.theme': '外観',
  'nav.theme.system': 'システム',
  'nav.theme.light': 'ライト',
  'nav.theme.dark': 'ダーク',
  'nav.menu': 'メニュー',
  'nav.close': '閉じる',

  'badge.devnet': 'Devnet',
  'badge.kidModeOn': 'キッズ保護有効',
  'badge.kidModeOff': '標準フィルタ',
  'badge.offline': '圏外モード',
  'badge.online': 'オンライン',

  'hero.kicker': 'SOLANA DEVNET · ローカル + クラウド対応',
  'hero.title.a': 'あらゆる動画リンクを',
  'hero.title.b': '広告や罠なしで再生。',
  'hero.lead':
    'YouTube、X、Instagram、Vimeo、直接ストリームのURLを貼り付けるだけ。追跡パラメータや違法賭博・フィッシング誘導を遮断し、電波の届かない山間部向けにオフライン保存します。',
  'hero.inputLabel': '検査して再生する動画リンク',
  'hero.inputPlaceholder': 'https://www.youtube.com/watch?v=... または https://x.com/.../status/...',
  'hero.ctaInspect': '検査して再生',
  'hero.ctaInspecting': 'リンクを検査中…',
  'hero.ctaVault': 'オフライン保管庫へ',
  'hero.samplePrefix': 'クイックテスト:',

  'shield.kicker': '5層リンク分離シールド',
  'shield.title': '映像バイトを読み込む前にすべてのURLを検証します。',
  'shield.scoreLabel': '安全スコア',
  'shield.verdict.SAFE': '安全を確認',
  'shield.verdict.CAUTION': '注意が必要',
  'shield.verdict.BLOCKED': '脅威を遮断',
  'shield.kidSafeYes': '子ども向け承認済み',
  'shield.kidSafeNo': 'キッズ保護で制限中',
  'shield.trackersRemoved': '追跡パラメータを{count}件削除',
  'shield.hopsUnwrapped': 'リダイレクトをサーバー側で{count}段展開',
  'shield.fingerprint': '安全ダイジェスト',

  'player.kicker': '分離再生とアーカイブ',
  'player.emptyTitle': '上の入力欄にリンクを貼って検査を開始',
  'player.emptyBody':
    'すべてのURLはプレーヤー起動前にSSRF検証、リダイレクト展開、賭博・フィッシング判定を通過します。',
  'player.blockedTitle': '再生前にブロックされました',
  'player.blockedBody':
    'PineReelは外部スクリプトやメディアが読み込まれる前にアクセスを停止しました。',
  'player.kidBlockedTitle': 'キッズ保護ロックにより制限',
  'player.kidBlockedBody':
    '保護者モード中に年齢制限または注意フラグを検出しました。解除するには保護者PINを入力してください。',
  'player.saveVault': 'オフライン保管庫へ保存',
  'player.savingVault': '保存中 ({progress})…',
  'player.savedVault': 'オフライン保管庫に保存済み',
  'player.downloadMp4': 'MP4をダウンロード',
  'player.openWatch': 'シアター表示',
  'player.speed': '再生速度',
  'player.anchorChain': 'Devnetに証明を記録',

  'vault.kicker': '圏外・山間部向けローカル保管庫',
  'vault.title': 'オフラインメディア保管庫',
  'vault.lead':
    '保存した動画はSHA-256検証付きでブラウザのIndexedDBに保持され、電波がゼロの山間部でもService Worker経由で再生できます。',
  'vault.emptyTitle': 'オフライン保管庫は空です',
  'vault.emptyBody':
    '直接MP4、Archive.org、X動画、またはローカルyt-dlpストリームを検査して保存を押してください。',
  'vault.emptyCta': '安全なサンプルを試す',
  'vault.storageUsed': '使用容量',
  'vault.itemCount': '{count}件のオフライン動画',
  'vault.playOffline': 'オフライン再生',
  'vault.verifyHash': 'SHA-256検証',
  'vault.hashVerified': '整合性を確認',
  'vault.hashMismatch': 'ハッシュ不一致',
  'vault.remove': '削除',
  'vault.guardianTitle': '保護者コントロール',
  'vault.pinLabel': '4〜8桁の保護者PINを設定',
  'vault.pinSave': '保護者PINを有効化',
  'vault.pinUnlock': 'PINで解除',
  'vault.pinLock': 'キッズ保護をロック',
  'vault.mountainOnly': '圏外専用ロック（外部URL入力を非表示）',

  'ledger.kicker': 'SOLANA DEVNET 検証',
  'ledger.title': 'オンチェーン安全台帳',
  'ledger.lead':
    '検査済み動画のSHA-256記録をSolana DevnetのMemoプログラムへ刻み、安全な教材リストを誰でも検証できます。',
  'ledger.walletConnect': 'ウォレット接続',
  'ledger.walletConnecting': '接続中…',
  'ledger.walletDisconnect': '切断',
  'ledger.walletNoExt': 'ウォレット接続は任意です',
  'ledger.slotLabel': '確定スロット',
  'ledger.refresh': 'Devnet更新',
  'ledger.txIdle': '記録の準備完了',
  'ledger.txBuilding': 'トランザクション準備中…',
  'ledger.txSigning': 'ウォレットで承認してください…',
  'ledger.txSent': 'Devnetへ送信済み',
  'ledger.txConfirmed': 'Devnetで確認済み',
  'ledger.txFinalized': 'Devnetで確定',
  'ledger.viewExplorer': 'Explorerで確認',
  'ledger.copyAddr': 'アドレスをコピー',
  'ledger.copied': 'コピー完了',
  'ledger.emptyTitle': 'Devnet証明がまだありません',
  'ledger.emptyBody': '更新またはDevnetウォレットを接続してライブ記録を表示します。',

  'walkthrough.kicker': '自動製品デモ',
  'walkthrough.title': '40秒でわかる安全検査とオフライン再生フロー。',
  'walkthrough.lead':
    '本番ビルドから直接録画: 追跡パラメータ除去、賭博リンク遮断、オフライン保存、Devnet検証までを実演します。',

  'how.kicker': 'システム構成',
  'how.title': 'ローカルyt-dlpとサーバーレスクラウドの双方で動作する設計。',
  'how.step1Title': '1. サーバー側リダイレクト・SSRF防御',
  'how.step1Body':
    '短縮URLを最大5ホップまで展開し、プライベートIPや詐欺・賭博・実行ファイルを再生前に遮断します。',
  'how.step2Title': '2. ハイブリッド抽出エンジン',
  'how.step2Body':
    'ローカルのyt-dlpとffmpegを自動検出し、クラウド環境ではYouTube・X・Vimeo・Archive向けのTypeScript抽出へ切り替えます。',
  'how.step3Title': '3. IndexedDB保管庫とDevnet証明',
  'how.step3Body':
    '直接ストリームをSHA-256付きで端末に保存し、圏外視聴とSolana Devnet上の検証に対応します。',

  'deck.kicker': 'アーキテクチャと計画',
  'deck.title': 'PineReel プロダクトデッキ',
  'deck.lead': '課題分析、5層防御、3段階抽出エンジン、Solana Devnet信頼モデルの構成資料。',

  'footer.note': 'PineReelは広告、行動解析、外部トラッカーを一切含みません。',
};

