export type SolanaCluster = 'devnet' | 'testnet' | 'mainnet-beta';

export const SOLANA_CLUSTER: SolanaCluster =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as SolanaCluster) || 'devnet';

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

export const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

// Public Devnet address hosting verified PineReel baseline Memo attestations.
export const PINEREEL_LEDGER_ADDRESS = 'AUo5JFnRhLtD6PJaWDj98M2ZmHWbLPcrKiR2QPY95AG7';

export function explorerUrl(kind: 'tx' | 'address', id: string, cluster = SOLANA_CLUSTER): string {
  const q = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `https://explorer.solana.com/${kind}/${id}${q}`;
}

export function shortAddr(addr: string, head = 4, tail = 4): string {
  if (!addr) return '';
  return addr.length <= head + tail + 1 ? addr : `${addr.slice(0, head)}\u2026${addr.slice(-tail)}`;
}
