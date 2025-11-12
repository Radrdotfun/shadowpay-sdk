# ShadowPay SDK

> Private payments on Solana, as easy as Stripe.

[![npm version](https://img.shields.io/npm/v/@shadowpay/client.svg)](https://www.npmjs.com/package/@shadowpay/client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**ShadowPay** is a developer-friendly TypeScript SDK that makes accepting private payments on Solana as simple as using Stripe. No crypto complexity—just clean, production-ready code.

## ✨ Features

- 🔐 **Zero-Knowledge Proofs** - Private payments without revealing amounts
- ⚡ **3 Lines of Code** - Accept payments in minutes
- 💰 **Multi-Token Support** - SOL, USDC, USDT out of the box
- 🎨 **Beautiful DX** - TypeScript-first with excellent IDE support
- 🔗 **Framework Agnostic** - Works with Next.js, Express, Remix, and more
- 👛 **Wallet Support** - Phantom, Solflare, Backpack, and more
- 🪝 **Webhooks** - Real-time payment notifications
- 📦 **Zero Configuration** - Works out of the box

## 🚀 Quick Start

### 1. Install

```bash
npm install @shadowpay/client @shadowpay/server
```

### 2. Client (3 lines)

```typescript
import { ShadowPay } from '@shadowpay/client';

const shadowpay = new ShadowPay();

const payment = await shadowpay.pay({
  to: 'YOUR_API_KEY',
  amount: 0.001,
  token: 'SOL',
  wallet: phantomWallet,
});
```

### 3. Server (middleware)

```typescript
import { ShadowPay } from '@shadowpay/server';

const shadowpay = new ShadowPay({ apiKey: 'YOUR_API_KEY' });

app.get('/premium',
  shadowpay.requirePayment({ amount: 0.001, token: 'SOL' }),
  (req, res) => res.json({ secret: 'Premium content!' })
);
```

That's it! 🎉

## 📖 Documentation

- [Quickstart Guide](./docs/quickstart.md) - Get started in 5 minutes
- [API Reference](./docs/api-reference.md) - Complete API documentation
- [Token Support](./docs/tokens.md) - Multi-token payments (SOL/USDC/USDT)
- [Webhooks](./docs/webhooks.md) - Real-time payment notifications
- [Advanced Usage](./docs/advanced.md) - Advanced features and customization

## 💡 Philosophy

**Hide all crypto complexity.** Developers should never see "Groth16", "ElGamal", or "nullifier" unless they want to.

```typescript
// ❌ Before ShadowPay
const keys = await generateBN254KeyPair();
const encrypted = elgamalEncrypt(amount, keys.publicKey);
const proof = await groth16.fullProve(circuitInputs, wasmPath, zkeyPath);
const nullifier = poseidonHash([privateKey, commitment, index]);
await verifyProof(proof, publicSignals, verificationKey);
// ... 50 more lines

// ✅ With ShadowPay
await shadowpay.pay({ to: 'merchant', amount: 0.001, token: 'SOL', wallet });
```

## 🏗️ Architecture

```
shadowpay-sdk/
├── packages/
│   ├── client/         # Browser SDK (payment generation)
│   ├── server/         # Node.js SDK (payment verification)
│   └── core/           # Shared crypto utilities
├── examples/
│   ├── nextjs-paywall/ # Next.js 14 example
│   └── express-api/    # Express.js example
└── docs/               # Documentation
```

## 📦 Packages

| Package | Description | Version |
|---------|-------------|---------|
| [@shadowpay/client](./packages/client) | Browser SDK for making payments | ![npm](https://img.shields.io/npm/v/@shadowpay/client) |
| [@shadowpay/server](./packages/server) | Node.js SDK for accepting payments | ![npm](https://img.shields.io/npm/v/@shadowpay/server) |
| [@shadowpay/core](./packages/core) | Core cryptographic utilities | ![npm](https://img.shields.io/npm/v/@shadowpay/core) |

## 🎯 Use Cases

### Paywalls

```typescript
// Protect content behind payment
app.get('/article',
  shadowpay.requirePayment({ amount: 0.001, token: 'SOL' }),
  (req, res) => res.json({ article: '...' })
);
```

### API Monetization

```typescript
// Charge per API call
app.post('/api/generate',
  shadowpay.requirePayment({ amount: 0.01, token: 'SOL' }),
  async (req, res) => {
    const result = await aiModel.generate(req.body);
    res.json(result);
  }
);
```

### Subscriptions

```typescript
// Monthly subscription
app.get('/premium/*',
  shadowpay.requirePayment({ amount: 10, token: 'USDC' }),
  premiumContentHandler
);
```

### Micro-Payments

```typescript
// Pay per feature
const payment = await shadowpay.pay({
  to: 'merchant',
  amount: 0.0001, // Fraction of a cent
  token: 'SOL',
  wallet,
});
```

## 🌟 Examples

### Next.js Paywall

```typescript
// app/api/premium/route.ts
import { ShadowPay } from '@shadowpay/server';

const shadowpay = new ShadowPay({ apiKey: process.env.SHADOWPAY_API_KEY });

export async function GET(req: NextRequest) {
  const paymentHeader = req.headers.get('x-payment');

  if (!paymentHeader) {
    return NextResponse.json({ ... }, { status: 402 });
  }

  const isValid = await shadowpay.verifyPayment(paymentHeader, {
    amount: 0.001,
  });

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid payment' }, { status: 402 });
  }

  return NextResponse.json({ secret: 'Premium content!' });
}
```

See [full example](./examples/nextjs-paywall).

### Express API

```typescript
import express from 'express';
import { ShadowPay } from '@shadowpay/server';

const app = express();
const shadowpay = new ShadowPay({ apiKey: 'YOUR_API_KEY' });

// SOL payment
app.get('/api/data/sol',
  shadowpay.requirePayment({ amount: 0.001, token: 'SOL' }),
  (req, res) => res.json({ data: 'SOL content' })
);

// USDC payment
app.get('/api/data/usdc',
  shadowpay.requirePayment({ amount: 1, token: 'USDC' }),
  (req, res) => res.json({ data: 'USDC content' })
);

// Webhooks
app.post('/webhooks/shadowpay',
  express.raw({ type: 'application/json' }),
  shadowpay.webhooks.handler((event) => {
    console.log('Payment:', event.data);
  })
);

app.listen(3000);
```

See [full example](./examples/express-api).

## 🔐 How It Works

1. **Client** generates ElGamal keys (stored in localStorage)
2. **Client** encrypts payment amount with ElGamal on BN254
3. **Client** generates zero-knowledge proof using Groth16
4. **Client** submits proof to ShadowPay API
5. **API** verifies proof and executes Solana transaction
6. **Server** verifies payment and returns protected content

**Privacy:** No one (including ShadowPay) can see the payment amount except the payer and merchant.

## 🛠️ Technology Stack

- **Zero-Knowledge Proofs:** Groth16 (via snarkjs)
- **Encryption:** ElGamal on BN254 curve (via @noble/curves)
- **Hashing:** Poseidon (via circomlibjs)
- **Blockchain:** Solana (via @solana/web3.js)
- **Wallets:** Phantom, Solflare, Backpack, and more

## 🎨 Multi-Token Support

| Token | Symbol | Use Case |
|-------|--------|----------|
| Solana | `SOL` | Fast micro-payments |
| USD Coin | `USDC` | Stable pricing (USD-pegged) |
| Tether USD | `USDT` | Stable pricing (USD-pegged) |

```typescript
// Pay with SOL
await shadowpay.pay({ amount: 0.001, token: 'SOL', ... });

// Pay with USDC
await shadowpay.pay({ amount: 1.0, token: 'USDC', ... });

// Pay with USDT
await shadowpay.pay({ amount: 5.0, token: 'USDT', ... });
```

See [token documentation](./docs/tokens.md) for details.

## 🪝 Webhooks

Receive real-time notifications:

```typescript
app.post('/webhooks/shadowpay',
  express.raw({ type: 'application/json' }),
  shadowpay.webhooks.handler((event) => {
    switch (event.type) {
      case 'payment.success':
        console.log('Payment received:', event.data);
        break;
      case 'payment.failed':
        console.log('Payment failed:', event.data);
        break;
      case 'payment.refunded':
        console.log('Payment refunded:', event.data);
        break;
    }
  })
);
```

See [webhook documentation](./docs/webhooks.md) for details.

## 🧪 Testing

Run tests:

```bash
# Install dependencies
pnpm install

# Build packages
pnpm build

# Run tests
pnpm test
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/shadowpay/sdk.git
cd sdk

# Install dependencies
pnpm install

# Build packages
pnpm build

# Run examples
cd examples/nextjs-paywall
pnpm dev
```

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🌐 Links

- **Website:** [shadow.radr.fun](https://shadow.radr.fun)
- **Documentation:** [docs.shadow.radr.fun](https://docs.shadow.radr.fun)
- **Discord:** [discord.gg/shadowpay](https://discord.gg/shadowpay)
- **Twitter:** [@shadowpay](https://twitter.com/shadowpay)
- **GitHub:** [github.com/shadowpay/sdk](https://github.com/shadowpay/sdk)

## 🙏 Acknowledgments

Built with:
- [snarkjs](https://github.com/iden3/snarkjs) - Zero-knowledge proof generation
- [@noble/curves](https://github.com/paulmillr/noble-curves) - Elliptic curve cryptography
- [circomlibjs](https://github.com/iden3/circomlibjs) - Poseidon hash
- [@solana/web3.js](https://github.com/solana-labs/solana-web3.js) - Solana blockchain
- [Turbo](https://turbo.build/) - Monorepo build system

## 💬 Support

Need help?

- 📧 **Email:** support@shadow.radr.fun
- 💬 **Discord:** [Join our community](https://discord.gg/shadowpay)
- 📚 **Docs:** [Documentation](./docs/quickstart.md)
- 🐛 **Issues:** [GitHub Issues](https://github.com/shadowpay/sdk/issues)

---

**Made with ❤️ by the ShadowPay team**

*Accept private payments on Solana in 3 lines of code.*

