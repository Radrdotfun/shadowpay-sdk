# ShadowPay SDK

**Private payments on Solana - as easy as Stripe.**

* **Packages:** `@shadowpay/core`, `@shadowpay/client`, `@shadowpay/server`
* **Language:** TypeScript
* **License:** MIT
* **Status:** Public beta (devnet support; mainnet coming soon)

> ShadowPay makes accepting **private, automated x402-style payments** on Solana simple. You get **on-chain PDA escrow**, **Groth16 ZK proofs**, **ElGamal-encrypted amounts**, and **spending authorizations** for agents/subscriptions - without touching raw crypto primitives.

---

## ✨ Features

* **Zero-Knowledge settlement** - Groth16 proofs verify payment validity without revealing sender or amount
* **Encrypted amounts** - ElGamal (BN254); **only the merchant** can decrypt the value
* **On-chain PDA escrow** - non-custodial, verifiable settlement (no off-chain IOUs)
* **x402-friendly** - drop-in for API/paywall flows using HTTP 402
* **Automatic payments** - ShadowID-tied spending authorizations with ZK rate-limits
* **Multi-token** - SOL / USDC / USDT (any SPL token)
* **TypeScript-first DX** - clear types, great IDE hints
* **Framework-agnostic** - Next.js / Express / Remix / Fastify / Cloudflare Workers†
* **Webhooks** - real-time notifications on payment events

† Workers support uses fetch-compatible adapters; see examples.

---

## 🚀 Quick Start

### 1) Install

```bash
npm i @shadowpay/core @shadowpay/client @shadowpay/server
# or
pnpm add @shadowpay/core @shadowpay/client @shadowpay/server
```

### 2) Client (3 lines)

```ts
import { ShadowPay } from '@shadowpay/client'

const sp = new ShadowPay()

const payment = await sp.pay({
  to: '<MERCHANT_PUBKEY>',       // your merchant public key
  amount: 0.001,                 // human units
  token: 'SOL',                  // 'SOL' | 'USDC' | 'USDT' | <SPL mint>
  wallet: window.phantom,        // Phantom / Solflare / Backpack
})
```

### 3) Server (middleware)

```ts
import express from 'express'
import { ShadowPay } from '@shadowpay/server'

const app = express()
const shadowpay = new ShadowPay({ apiKey: process.env.SHADOWPAY_API_KEY! })

app.get('/premium',
  shadowpay.requirePayment({ amount: 0.001, token: 'SOL' }),
  (req, res) => res.json({ secret: 'Premium content!' })
)

app.listen(3000)
```

---

## 🧩 Next.js Example (Route Handler)

```ts
// app/api/premium/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ShadowPay } from '@shadowpay/server'

const sp = new ShadowPay({ apiKey: process.env.SHADOWPAY_API_KEY! })

export async function GET(req: NextRequest) {
  const hdr = req.headers.get('x-payment')
  if (!hdr) return NextResponse.json({ error: 'Payment Required' }, { status: 402 })

  const ok = await sp.verifyPayment(hdr, { amount: 0.001, token: 'SOL' })
  if (!ok) return NextResponse.json({ error: 'Invalid payment' }, { status: 402 })

  return NextResponse.json({ secret: 'Premium content!' })
}
```

---

## 🎯 Use Cases

* **Paywalls** - protect routes/content with 402 flows
* **API monetization** - charge per request (agents, data APIs)
* **Subscriptions** - private, recurring payments via authorizations
* **Micro-payments** - sub-cent features using SOL or stablecoins

---

## 🔐 How It Works (high-level)

1. Client generates an ElGamal keypair (BN254); public key shared with the merchant
2. Client encrypts the **amount** to the merchant's public key
3. Client creates a **Groth16 proof** attesting valid spend & authorization
4. Server/settler verifies the proof and triggers **on-chain PDA escrow**
5. Program checks **bitmap nullifier** (O(1) replay protection) and settles
6. Merchant decrypts amount if/when needed; facilitator remains **blind**

> Privacy model: No third party (including ShadowPay) can see payment amounts. Sender knows what they paid; merchant can decrypt. Others cannot.

**Program ID:** `GQBqwwoikYh7p6KEUHDUu5r9dHHXx9tMGskAPubmFPzD` ([View on Solscan](https://solscan.io/account/GQBqwwoikYh7p6KEUHDUu5r9dHHXx9tMGskAPubmFPzD))

---

## 🧱 Architecture (monorepo)

```
shadowpay-sdk/
├─ packages/
│  ├─ client/     # Browser SDK (payment generation, wallet adapters)
│  ├─ server/     # Node SDK (verification, middleware, webhooks)
│  └─ core/       # Shared types/crypto/utils
├─ examples/
│  ├─ nextjs-paywall/
│  └─ express-api/
└─ docs/
```

---

## 📦 Packages

| Package             | Description                        | npm                                                    |
| ------------------- | ---------------------------------- | ------------------------------------------------------ |
| `@shadowpay/client` | Browser SDK for making payments    | [npm](https://www.npmjs.com/package/@shadowpay/client) |
| `@shadowpay/server` | Node.js SDK for accepting payments | [npm](https://www.npmjs.com/package/@shadowpay/server) |
| `@shadowpay/core`   | Core cryptographic utilities       | [npm](https://www.npmjs.com/package/@shadowpay/core)   |

GitHub: [https://github.com/Radrdotfun/shadowpay-sdk](https://github.com/Radrdotfun/shadowpay-sdk)

---

## 🪝 Webhooks

```ts
app.post('/webhooks/shadowpay',
  express.raw({ type: 'application/json' }),
  shadowpay.webhooks.handler((event) => {
    switch (event.type) {
      case 'payment.success':
        // handle success
        break
      case 'payment.failed':
        // handle failure
        break
      case 'payment.refunded':
        // handle refund
        break
    }
  })
)
```

---

## 🔧 Configuration & Security

* **API keys** via env vars: `SHADOWPAY_API_KEY`
* **Network**: default `devnet`; override via SDK options or env
* **Program ID**: `GQBqwwoikYh7p6KEUHDUu5r9dHHXx9tMGskAPubmFPzD`
* **Rate limits**: ShadowID authorizations + ZK limits for agents
* **No secrets in client**; never embed server keys in frontends

---

## 🧪 Testing

```bash
pnpm install
pnpm build
pnpm test
```

---

## 📚 Documentation

* Quickstart (5 min)
* API Reference (client/server/core)
* Token Support (SOL/USDC/USDT + custom SPL)
* Webhooks
* Advanced: custom wallets, authorizations, Workers

> Full docs: [https://registry.scalar.com/@radr/apis/shadowpay-api/latest](https://registry.scalar.com/@radr/apis/shadowpay-api/latest)

---

## 🧠 Philosophy

Hide crypto complexity by default. If you want raw primitives (Groth16, ElGamal, Poseidon, nullifiers), they're in `@shadowpay/core` - but typical apps never need to touch them.

**Before**

```ts
// 50+ lines of proof plumbing and encryption
```

**With ShadowPay**

```ts
await sp.pay({ to: '<merchant>', amount: 0.001, token: 'SOL', wallet })
```

---

## 🧰 Tech Stack

* ZK: Groth16 (snarkjs)
* Crypto: ElGamal (BN254) via `@noble/curves`
* Hash: Poseidon (circomlibjs)
* Chain: Solana (`@solana/web3.js`)
* Build: Turbo / pnpm

---

## 🤝 Contributing

PRs welcome! See `CONTRIBUTING.md`.

### Dev setup

```bash
git clone https://github.com/Radrdotfun/shadowpay-sdk.git
cd shadowpay-sdk
pnpm install
pnpm build
pnpm -C examples/nextjs-paywall dev
```

---

## 📄 License

MIT © Radr

---

## Links

* Website: [https://radr.fun](https://radr.fun)
* Docs: [https://registry.scalar.com/@radr/apis/shadowpay-api/latest](https://registry.scalar.com/@radr/apis/shadowpay-api/latest)
* Telegram: [https://t.me/radrdotfun](https://t.me/radrdotfun)
* X (Twitter): [https://x.com/radrdotfun](https://x.com/radrdotfun)
* GitHub: [https://github.com/Radrdotfun/shadowpay-sdk](https://github.com/Radrdotfun/shadowpay-sdk)

---

## Notes & Disclaimers

* **Privacy model**: amounts are visible only to payer + merchant; facilitators/settlers remain blind.
* **Environment**: Some examples default to `devnet`. Switch to `mainnet-beta` when ready.
* **Security**: Rotate API keys, validate webhooks, keep servers behind TLS.
