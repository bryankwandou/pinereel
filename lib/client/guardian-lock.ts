// Client-side Guardian PIN lock using Web Crypto PBKDF2-SHA256 + per-device salt.
// Zero plaintext secrets are stored.

export interface GuardianState {
  pinSet: boolean;
  kidModeLocked: boolean;
  mountainVaultOnly: boolean;
  saltHex?: string;
  hashHex?: string;
}

const STORAGE_KEY = 'pinereel.guardian.v1';

const DEFAULT_STATE: GuardianState = {
  pinSet: false,
  kidModeLocked: true,
  mountainVaultOnly: false,
};

export function readGuardianState(): GuardianState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<GuardianState>;
    return {
      pinSet: Boolean(parsed.pinSet && parsed.saltHex && parsed.hashHex),
      kidModeLocked: typeof parsed.kidModeLocked === 'boolean' ? parsed.kidModeLocked : true,
      mountainVaultOnly: Boolean(parsed.mountainVaultOnly),
      saltHex: typeof parsed.saltHex === 'string' ? parsed.saltHex : undefined,
      hashHex: typeof parsed.hashHex === 'string' ? parsed.hashHex : undefined,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function writeGuardianState(state: GuardianState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Private browsing / blocked storage degrades safely */
  }
}

async function derivePinHex(pin: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const saltBytes = new Uint8Array(
    saltHex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? []
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 120_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createGuardianPin(pin: string): Promise<GuardianState> {
  if (!/^\d{4,8}$/.test(pin)) {
    throw new Error('Guardian PIN must be 4 to 8 digits.');
  }
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hashHex = await derivePinHex(pin, saltHex);
  const next: GuardianState = {
    pinSet: true,
    kidModeLocked: true,
    mountainVaultOnly: false,
    saltHex,
    hashHex,
  };
  writeGuardianState(next);
  return next;
}

export async function verifyGuardianPin(pin: string, state: GuardianState): Promise<boolean> {
  if (!state.pinSet || !state.saltHex || !state.hashHex) return false;
  const candidate = await derivePinHex(pin, state.saltHex);
  if (candidate.length !== state.hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ state.hashHex.charCodeAt(i);
  }
  return diff === 0;
}

