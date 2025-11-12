# ShadowPay Next.js Paywall Example

A complete example of using ShadowPay to create a paywall for premium content in Next.js 14 with App Router.

## Features

- 💳 Accept SOL payments for premium content
- 🔐 Zero-knowledge payment verification
- 🎨 Beautiful UI with Tailwind CSS
- 👛 Support for Phantom, Solflare, and Backpack wallets
- ⚡ Next.js 14 App Router with React Server Components

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env.local` file:

```bash
cp .env.example .env.local
```

3. Get your ShadowPay API key:

```bash
curl -X POST https://shadow.radr.fun/shadowpay/v1/keys/new \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "YOUR_SOLANA_WALLET"}'
```

4. Add your API key to `.env.local`:

```
SHADOWPAY_API_KEY=sk_your_api_key_here
NEXT_PUBLIC_NETWORK=mainnet-beta
```

## Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Frontend** (`app/page.tsx`):
   - User connects their Solana wallet
   - Clicks "Unlock for 0.001 SOL"
   - ShadowPay generates ZK proof and submits payment
   - Receipt is used to fetch premium content

2. **Backend** (`app/api/premium/route.ts`):
   - Checks for `X-PAYMENT` header
   - Returns 402 if missing
   - Verifies payment with ShadowPay API
   - Returns premium content if valid

## Code Highlights

### Client Payment (3 lines):

```typescript
const shadowpay = new ShadowPay()
const payment = await shadowpay.pay({
  to: 'YOUR_API_KEY',
  amount: 0.001,
  token: 'SOL',
  wallet: phantomWallet,
})
```

### Server Verification:

```typescript
const shadowpay = new ShadowPay({ apiKey: process.env.SHADOWPAY_API_KEY })
const isValid = await shadowpay.verifyPayment(paymentHeader, { amount: 0.001 })
```

## Learn More

- [ShadowPay Documentation](../../docs/quickstart.md)
- [API Reference](../../docs/api-reference.md)
- [Token Support](../../docs/tokens.md)

