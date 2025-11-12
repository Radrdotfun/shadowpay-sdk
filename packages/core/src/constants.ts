/**
 * Core constants for ShadowPay SDK
 */

export const API_URL = 'https://shadow.radr.fun';

export const PROGRAM_ID = 'GQBqwwoikYh7p6KEUHDUu5r9dHHXx9tMGskAPubmFPzD';

export const ENDPOINTS = {
  verify: '/shadowpay/verify',
  settle: '/shadowpay/settle',
  supported: '/shadowpay/supported',
  newKey: '/shadowpay/v1/keys/new',
} as const;

export const CIRCUIT_URLS = {
  wasm: 'https://shadow.radr.fun/shadowpay/circuit-elgamal/shadowpay-elgamal_js/shadowpay-elgamal.wasm',
  zkey: 'https://shadow.radr.fun/shadowpay/circuit-elgamal/shadowpay-elgamal_final.zkey',
  vkey: 'https://shadow.radr.fun/shadowpay/circuit-elgamal/shadowpay-elgamal_verification_key.json',
} as const;

// Circuit versions for different implementations
export const CIRCUIT_VERSIONS = {
  elgamal: {
    wasm: 'https://shadow.radr.fun/shadowpay/circuit-elgamal/shadowpay-elgamal_js/shadowpay-elgamal.wasm',
    zkey: 'https://shadow.radr.fun/shadowpay/circuit-elgamal/shadowpay-elgamal_final.zkey',
    vkey: 'https://shadow.radr.fun/shadowpay/circuit-elgamal/shadowpay-elgamal_verification_key.json',
  },
  // Future: Add basic circuit version if needed
  // basic: { wasm: '...', zkey: '...', vkey: '...' },
} as const;

export const NETWORK = {
  MAINNET: 'mainnet-beta',
  DEVNET: 'devnet',
} as const;

export const STORAGE_KEYS = {
  ELGAMAL_KEYS: 'shadowpay_keys',
  PAYMENT_HISTORY: 'shadowpay_payments',
} as const;

export const X402_VERSION = 1;

export const PAYMENT_SCHEME = 'zkproof' as const;

