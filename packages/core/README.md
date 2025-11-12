# @shadowpay/core

Core cryptographic utilities for the ShadowPay SDK. Provides zero-knowledge proof primitives, ElGamal encryption, Poseidon hashing, and commitment generation for private payments on Solana.

## Installation

```bash
npm install @shadowpay/core
```

## Features

- **ElGamal Encryption** - Encrypt payment amounts on BN254 curve
- **Poseidon Hashing** - Generate cryptographic commitments and nullifiers
- **Commitment Generation** - Create sender and payment commitments
- **Field Element Operations** - Convert Solana addresses to BN254 field elements
- **Token Utilities** - Parse amounts for SOL, USDC, and USDT

## Usage

### ElGamal Encryption

```typescript
import { generateElGamalKeypair, encryptAmount } from '@shadowpay/core';

const keypair = generateElGamalKeypair();
const encrypted = encryptAmount(1000000n, keypair.publicKey);

console.log(encrypted.c1); // Ciphertext component 1
console.log(encrypted.c2); // Ciphertext component 2
```

### Generate Commitments

```typescript
import {
  generateRandomSecret,
  generateRandomSalt,
  computeSenderCommitment,
  computePaymentCommitment,
} from '@shadowpay/core';

const secret = generateRandomSecret();
const salt = generateRandomSalt();

const senderCommitment = await computeSenderCommitment(
  'YourWalletAddressHere',
  secret
);

const paymentCommitment = await computePaymentCommitment(
  senderCommitment,
  receiverCommitment,
  1000000n,
  'SOL',
  salt
);
```

### Token Utilities

```typescript
import { parseAmount, TOKENS } from '@shadowpay/core';

const lamports = parseAmount(0.001, 'SOL'); // 1000000
const usdcAmount = parseAmount(10, 'USDC'); // 10000000
```

## API Reference

### Encryption

- `generateElGamalKeypair()` - Generate ElGamal keypair
- `encryptAmount(amount, publicKey)` - Encrypt an amount

### Commitments

- `generateRandomSecret()` - Generate random secret (32 bytes)
- `generateRandomSalt()` - Generate random salt (32 bytes)
- `computeSenderCommitment(walletPubkey, secret)` - Generate sender commitment
- `computePaymentCommitment(sender, receiver, amount, token, salt)` - Generate payment commitment
- `computePaymentNullifier(secret, commitment)` - Generate nullifier
- `addressToFieldElement(address)` - Convert Solana address to field element

### Tokens

- `parseAmount(amount, token)` - Convert human-readable amount to lamports
- `TOKENS` - Token configuration (SOL, USDC, USDT)

## Constants

```typescript
export const API_URL = 'https://shadow.radr.fun';
export const CIRCUIT_URLS = {
  wasm: 'https://shadow.radr.fun/shadowpay/circuit-elgamal/...',
  zkey: 'https://shadow.radr.fun/shadowpay/circuit-elgamal/...',
  vkey: 'https://shadow.radr.fun/shadowpay/circuit-elgamal/...',
};
```

**Solana Program ID:** `GQBqwwoikYh7p6KEUHDUu5r9dHHXx9tMGskAPubmFPzD` ([View on Solscan](https://solscan.io/account/GQBqwwoikYh7p6KEUHDUu5r9dHHXx9tMGskAPubmFPzD))

## License

MIT

