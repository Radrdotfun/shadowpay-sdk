# @shadowpay/server

Node.js SDK for accepting private payments with ShadowPay. Verify payments and protect server-side content with Express middleware.

## Installation

```bash
npm install @shadowpay/server
```

## Quick Start

```typescript
import express from 'express';
import { ShadowPay } from '@shadowpay/server';

const app = express();
const shadowpay = new ShadowPay({ apiKey: 'YOUR_API_KEY' });

app.get(
  '/api/premium',
  shadowpay.requirePayment({ amount: 0.001, token: 'SOL' }),
  (req, res) => {
    res.json({ secret: 'Premium content!' });
  }
);

app.listen(3000);
```

## Features

- **Payment Verification** - Verify access tokens from ShadowPay client
- **Express Middleware** - Easy integration with Express.js
- **Webhook Support** - Handle real-time payment notifications
- **Type-Safe API** - Full TypeScript support

## API Reference

### ShadowPay Constructor

```typescript
const shadowpay = new ShadowPay({
  apiKey: string; // Your API key from ShadowPay
  apiUrl?: string; // Optional: Custom API URL
});
```

### verifyPayment()

Manually verify an access token:

```typescript
const isValid = await shadowpay.verifyPayment(accessToken, {
  amount: 0.001,
  token: 'SOL',
});

if (isValid) {
  // Grant access to content
}
```

### requirePayment() Middleware

Protect routes with payment requirement:

```typescript
app.get(
  '/protected-route',
  shadowpay.requirePayment({
    amount: number; // Required amount in tokens
    token?: 'SOL' | 'USDC' | 'USDT'; // Default: 'SOL'
  }),
  (req, res) => {
    // This only runs if payment is valid
    res.json({ data: 'Protected content' });
  }
);
```

### Webhook Handler

Handle real-time payment events:

```typescript
app.post(
  '/webhooks/shadowpay',
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

## Examples

### Next.js API Route

```typescript
// app/api/premium/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get('X-Access-Token');

  if (!accessToken) {
    return NextResponse.json({ error: 'Payment required' }, { status: 402 });
  }

  const verification = await fetch(
    'https://shadow.radr.fun/shadowpay/v1/payment/verify-access',
    {
      headers: { 'X-Access-Token': accessToken },
    }
  );

  if (!verification.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { authorized } = await verification.json();

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ secret: 'Premium content!' });
}
```

### Express.js Complete Example

```typescript
import express from 'express';
import { ShadowPay } from '@shadowpay/server';

const app = express();
const shadowpay = new ShadowPay({ apiKey: process.env.SHADOWPAY_API_KEY! });

app.use(express.json());

app.get('/api/free', (req, res) => {
  res.json({ data: 'Free content' });
});

app.get(
  '/api/premium/sol',
  shadowpay.requirePayment({ amount: 0.001, token: 'SOL' }),
  (req, res) => {
    res.json({ data: 'SOL-gated content' });
  }
);

app.get(
  '/api/premium/usdc',
  shadowpay.requirePayment({ amount: 1.0, token: 'USDC' }),
  (req, res) => {
    res.json({ data: 'USDC-gated content' });
  }
);

app.post(
  '/webhooks/shadowpay',
  express.raw({ type: 'application/json' }),
  shadowpay.webhooks.handler((event) => {
    console.log('Payment event:', event.type, event.data);
  })
);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## Environment Variables

```bash
SHADOWPAY_API_KEY=your_api_key_here
```

## Error Handling

```typescript
app.use((err, req, res, next) => {
  if (err.name === 'PaymentRequiredError') {
    return res.status(402).json({ error: 'Payment required' });
  }
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid or expired payment' });
  }
  next(err);
});
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  PaymentRequirement,
  PaymentVerification,
  WebhookEvent,
} from '@shadowpay/server';
```

## Testing

```typescript
import request from 'supertest';
import { ShadowPay } from '@shadowpay/server';

describe('Protected routes', () => {
  it('requires payment', async () => {
    const response = await request(app).get('/api/premium').expect(402);

    expect(response.body.error).toBe('Payment required');
  });

  it('grants access with valid token', async () => {
    const response = await request(app)
      .get('/api/premium')
      .set('X-Access-Token', validToken)
      .expect(200);

    expect(response.body.data).toBeDefined();
  });
});
```

## License

MIT

