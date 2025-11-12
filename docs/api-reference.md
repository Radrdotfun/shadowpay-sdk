# API Reference

Complete API documentation for ShadowPay SDK.

## Client SDK (@shadowpay/client)

### Installation

```bash
npm install @shadowpay/client @solana/wallet-adapter-react
```

### ShadowPay Class

```typescript
import { ShadowPay } from '@shadowpay/client';

const shadowpay = new ShadowPay(options);
```

#### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiUrl` | `string` | `'https://shadow.radr.fun'` | ShadowPay API URL |
| `network` | `'mainnet-beta' \| 'devnet'` | `'mainnet-beta'` | Solana network |

#### Methods

##### `pay(options: PaymentOptions): Promise<PaymentResult>`

Make a payment.

**PaymentOptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | `string` | Yes | Merchant wallet or API key |
| `amount` | `number` | Yes | Human-readable amount (e.g., 0.001) |
| `token` | `string` | No | Token symbol (default: 'SOL') |
| `wallet` | `WalletInterface` | Yes | Solana wallet adapter |
| `description` | `string` | No | Payment description |

**Returns: PaymentResult**

| Field | Type | Description |
|-------|------|-------------|
| `proof` | `any` | ZK proof |
| `signature` | `string` | Solana transaction signature |
| `nullifier` | `string` | Unique payment identifier |
| `commitment` | `string` | Payment commitment |
| `receipt` | `string` | Base64 receipt for verification |

**Example:**

```typescript
const payment = await shadowpay.pay({
  to: 'merchant_address',
  amount: 0.001,
  token: 'SOL',
  wallet: phantomWallet,
});

console.log('TX:', payment.signature);
console.log('Receipt:', payment.receipt);
```

##### `getPaymentHistory(): PaymentHistory[]`

Get payment history from localStorage.

**Returns:** Array of previous payments

##### `clearKeys(): void`

Clear stored ElGamal keys (for testing).

##### `clearHistory(): void`

Clear payment history.

---

## Server SDK (@shadowpay/server)

### Installation

```bash
npm install @shadowpay/server
```

### ShadowPay Class

```typescript
import { ShadowPay } from '@shadowpay/server';

const shadowpay = new ShadowPay(options);
```

#### Constructor Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your ShadowPay API key |
| `webhookSecret` | `string` | No | Webhook secret for signature verification |
| `apiUrl` | `string` | No | ShadowPay API URL (default: production) |

#### Methods

##### `requirePayment(requirement: PaymentRequirement)`

Express middleware to protect routes.

**PaymentRequirement:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | `number` | Yes | Required payment amount |
| `token` | `string` | No | Token symbol (default: 'SOL') |
| `description` | `string` | No | Payment description |

**Returns:** Express middleware function

**Example:**

```typescript
app.get('/premium',
  shadowpay.requirePayment({ amount: 0.001, token: 'SOL' }),
  (req, res) => {
    res.json({ data: 'Premium content' });
  }
);
```

##### `verifyPayment(header: string, requirement: PaymentRequirement): Promise<boolean>`

Verify a payment proof manually.

**Parameters:**
- `header` - Payment header from `X-PAYMENT`
- `requirement` - Payment requirements

**Returns:** `true` if valid, `false` otherwise

**Example:**

```typescript
const isValid = await shadowpay.verifyPayment(
  req.headers['x-payment'],
  { amount: 0.001, token: 'SOL' }
);
```

##### `verifyPaymentDetailed(header: string, requirement: PaymentRequirement): Promise<VerificationResult>`

Verify payment with detailed result.

**Returns: VerificationResult**

| Field | Type | Description |
|-------|------|-------------|
| `isValid` | `boolean` | Whether payment is valid |
| `amount` | `number` | Payment amount |
| `token` | `string` | Token used |
| `nullifier` | `string` | Payment nullifier |
| `message` | `string` | Error message (if invalid) |

##### `webhooks.handler(callback: WebhookHandler)`

Create webhook handler with signature verification.

**WebhookEvent:**

| Field | Type | Description |
|-------|------|-------------|
| `type` | `'payment.success' \| 'payment.failed' \| 'payment.refunded'` | Event type |
| `data` | `object` | Event data |
| `timestamp` | `number` | Event timestamp |

**Example:**

```typescript
app.post('/webhooks/shadowpay',
  express.raw({ type: 'application/json' }),
  shadowpay.webhooks.handler((event) => {
    if (event.type === 'payment.success') {
      console.log('Payment:', event.data);
      // Update database, send email, etc.
    }
  })
);
```

##### `generateApiKey(walletAddress: string): Promise<string>`

Generate a new API key.

**Parameters:**
- `walletAddress` - Your Solana wallet address

**Returns:** New API key

---

## Core SDK (@shadowpay/core)

Cryptographic utilities (advanced use only).

### Tokens

```typescript
import { TOKENS, parseAmount, formatAmount } from '@shadowpay/core';

// Get token config
const sol = TOKENS.SOL; // { symbol: 'SOL', mint: '...', decimals: 9 }

// Convert amount
const lamports = parseAmount(0.001, 'SOL'); // 1000000
const amount = formatAmount(1000000, 'SOL'); // 0.001
```

### ElGamal Encryption

```typescript
import { generateElGamalKeypair, encryptAmount } from '@shadowpay/core';

const keys = generateElGamalKeypair();
const encrypted = encryptAmount(1000000n, keys.publicKey);
```

### Nullifiers

```typescript
import { generateNullifier } from '@shadowpay/core';

const nullifier = await generateNullifier(
  privateKey,
  commitment,
  paymentIndex
);
```

---

## Error Handling

### Client Errors

```typescript
import { ShadowPayError } from '@shadowpay/client';

try {
  await shadowpay.pay({ ... });
} catch (error) {
  if (error instanceof ShadowPayError) {
    console.error('Status:', error.statusCode);
    console.error('Details:', error.details);
  }
}
```

### Server Errors

Server SDK returns 402 status codes for payment errors:

- `402 Payment Required` - Payment missing or invalid
- `401 Unauthorized` - Invalid webhook signature
- `500 Internal Server Error` - Server error

---

## TypeScript Types

All SDKs are fully typed. Import types:

```typescript
import type {
  PaymentOptions,
  PaymentResult,
  ShadowPayOptions,
} from '@shadowpay/client';

import type {
  ServerOptions,
  PaymentRequirement,
  WebhookEvent,
} from '@shadowpay/server';

import type {
  TokenConfig,
  ElGamalKeypair,
  EncryptedAmount,
} from '@shadowpay/core';
```

---

## Rate Limits

- **Proof generation:** No limit (client-side)
- **Payment settlement:** 100 requests/minute
- **Verification:** 1000 requests/minute
- **Webhooks:** No limit (signed)

## Support

- 📧 Email: support@shadow.radr.fun
- 💬 Discord: [discord.gg/shadowpay](https://discord.gg/shadowpay)
- 🐛 Issues: [GitHub Issues](https://github.com/shadowpay/sdk/issues)

