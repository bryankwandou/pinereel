export interface VaultItem {
  id: string;
  title: string;
  author: string;
  sourceUrl: string;
  sourceType: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  safetyScore: number;
  kidSafe: boolean;
  mediaSha256: string;
  savedAtMs: number;
  txSignature?: string;
  blob: Blob;
}

export type VaultSummary = Omit<VaultItem, 'blob'>;

const DB_NAME = 'pinereel_mountain_vault_v1';
const STORE_NAME = 'videos';

function openVaultDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable in this browser context'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('savedAtMs', 'savedAtMs', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open Mountain Vault storage'));
  });
}

export async function sha256Blob(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function listVaultSummaries(): Promise<VaultSummary[]> {
  const db = await openVaultDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const rows = (req.result as VaultItem[]).map(({ blob: _b, ...summary }) => summary);
      rows.sort((a, b) => b.savedAtMs - a.savedAtMs);
      resolve(rows);
    };
    req.onerror = () => reject(req.error || new Error('Failed to read Mountain Vault'));
  });
}

export async function getVaultItem(id: string): Promise<VaultItem | null> {
  const db = await openVaultDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve((req.result as VaultItem | undefined) ?? null);
    req.onerror = () => reject(req.error || new Error('Failed to load offline video'));
  });
}

export async function saveVaultItem(item: VaultItem): Promise<void> {
  const db = await openVaultDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Failed to write offline video'));
  });
}

export async function attachTxSignatureToVaultItem(id: string, txSignature: string): Promise<void> {
  const existing = await getVaultItem(id);
  if (!existing) return;
  await saveVaultItem({ ...existing, txSignature });
}

export async function removeVaultItem(id: string): Promise<void> {
  const db = await openVaultDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Failed to remove item'));
  });
}

export async function cacheStreamIntoVault(params: {
  id: string;
  streamUrl: string;
  title: string;
  author: string;
  sourceUrl: string;
  sourceType: string;
  mimeType: string;
  durationSeconds: number | null;
  safetyScore: number;
  kidSafe: boolean;
  onProgress?: (loadedBytes: number, totalBytes: number | null) => void;
}): Promise<VaultSummary> {
  const res = await fetch(params.streamUrl);
  if (!res.ok || !res.body) {
    throw new Error(`Stream fetch failed with HTTP ${res.status}`);
  }

  const totalRaw = res.headers.get('content-length');
  const totalBytes = totalRaw ? Number(totalRaw) : null;
  const reader = res.body.getReader();
  const chunks: BlobPart[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(new Uint8Array(value));
      loaded += value.byteLength;
      params.onProgress?.(loaded, Number.isFinite(totalBytes) ? totalBytes : null);
    }
  }

  const blob = new Blob(chunks, { type: params.mimeType || 'video/mp4' });
  const mediaSha256 = await sha256Blob(blob);

  const item: VaultItem = {
    id: params.id,
    title: params.title,
    author: params.author,
    sourceUrl: params.sourceUrl,
    sourceType: params.sourceType,
    mimeType: params.mimeType || 'video/mp4',
    sizeBytes: blob.size,
    durationSeconds: params.durationSeconds,
    safetyScore: params.safetyScore,
    kidSafe: params.kidSafe,
    mediaSha256,
    savedAtMs: Date.now(),
    blob,
  };

  await saveVaultItem(item);
  const { blob: _b, ...summary } = item;
  return summary;
}

export function formatBytes(bytes: number, locale = 'en'): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${new Intl.NumberFormat(locale).format(bytes)} B`;
  const units = ['KB', 'MB', 'GB'];
  let val = bytes / 1024;
  let idx = 0;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx++;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(val)} ${units[idx]}`;
}

