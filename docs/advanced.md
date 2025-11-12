# Advanced Usage

Advanced features and customization options.

## Manual Key Management

By default, ElGamal keys are auto-generated and stored in localStorage. For advanced use cases, you can manage keys manually.

### Export Keys

```typescript
import { ShadowPay } from '@shadowpay/client';

const shadowpay = new ShadowPay();

// Get stored keys from localStorage
const keys = JSON.parse(
  localStorage.getItem('shadowpay_keys') || '{}'
);

console.log('Private Key:', keys.privateKey);
console.log('Public Key:', keys.publicKey);
```

### Import Keys

```typescript
import { generateElGamalKeypair } from '@shadowpay/core';

// Generate keys elsewhere
const keys = generateElGamalKeypair();

// Store in localStorage
localStorage.setItem('shadowpay_keys', JSON.stringify({
  privateKey: keys.privateKey,
  publicKey: keys.publicKey,
  createdAt: Date.now(),
}));
```

### Key Rotation

```typescript
import { ShadowPay } from '@shadowpay/client';

const shadowpay = new ShadowPay();

// Clear old keys
shadowpay.clearKeys();

// New keys will be generated on next payment
await shadowpay.pay({ ... });
```

## Custom Proof Generation

For advanced users who want full control over proof generation:

```typescript
import { generateProof } from '@shadowpay/client';
import { generateElGamalKeypair, encryptAmount } from '@shadowpay/core';

// Generate keys
const keys = generateElGamalKeypair();

// Encrypt amount
const encrypted = encryptAmount(1000000n, keys.publicKey);

// Generate nullifier
const nullifier = await generateNullifier(
  keys.privateKey,
  commitment.value,
  0
);

// Generate proof manually
const { proof, publicSignals } = await generateProof({
  amount: 1000000,
  merchantPubkey: 'merchant_key',
  userSecret: keys.privateKey,
  nullifier: nullifier.value,
  encryptedAmount: encrypted,
});

// Use proof...
```

## Custom API URL

Use a custom ShadowPay API instance:

```typescript
// Client
const shadowpay = new ShadowPay({
  apiUrl: 'https://custom.shadowpay.com',
  network: 'mainnet-beta',
});

// Server
const shadowpay = new ShadowPay({
  apiKey: 'sk_...',
  apiUrl: 'https://custom.shadowpay.com',
});
```

## Payment History

Access and manage payment history:

```typescript
import { ShadowPay } from '@shadowpay/client';

const shadowpay = new ShadowPay();

// Get payment history
const history = shadowpay.getPaymentHistory();

history.forEach(payment => {
  console.log(`${payment.amount} ${payment.token} to ${payment.recipient}`);
  console.log(`TX: ${payment.signature}`);
  console.log(`Time: ${new Date(payment.timestamp)}`);
});

// Clear history
shadowpay.clearHistory();
```

## Custom Receipt Handling

Decode and verify receipts manually:

```typescript
function decodeReceipt(receipt: string) {
  const decoded = atob(receipt); // Base64 decode
  return JSON.parse(decoded);
}

const receiptData = decodeReceipt(payment.receipt);
console.log('Proof:', receiptData.proof);
console.log('Signature:', receiptData.signature);
console.log('Nullifier:', receiptData.nullifier);
```

## Dynamic Pricing

Adjust payment amounts dynamically:

```typescript
import { ShadowPay } from '@shadowpay/server';

const shadowpay = new ShadowPay({ apiKey: 'sk_...' });

// Dynamic pricing based on user tier
function getPricing(userTier: string) {
  switch (userTier) {
    case 'premium': return 0.001;
    case 'standard': return 0.005;
    case 'basic': return 0.01;
    default: return 0.01;
  }
}

app.get('/api/content/:tier',
  (req, res, next) => {
    const amount = getPricing(req.params.tier);
    return shadowpay.requirePayment({ amount, token: 'SOL' })(req, res, next);
  },
  (req, res) => {
    res.json({ content: 'Premium data' });
  }
);
```

## Rate Limiting by Payment

Implement rate limiting based on payment history:

```typescript
const paymentLimits = new Map();

app.get('/api/data',
  shadowpay.requirePayment({ amount: 0.001, token: 'SOL' }),
  (req, res) => {
    const nullifier = req.shadowpay?.nullifier;
    
    // Track usage
    const usage = paymentLimits.get(nullifier) || 0;
    if (usage >= 100) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    paymentLimits.set(nullifier, usage + 1);
    
    res.json({ data: '...' });
  }
);
```

## Multi-Step Payments

Implement payment flows with multiple steps:

```typescript
// Step 1: Initiate payment
app.post('/api/checkout/initiate', async (req, res) => {
  const orderId = generateOrderId();
  await db.orders.create({
    id: orderId,
    amount: 0.01,
    token: 'SOL',
    status: 'pending',
  });
  
  res.json({ orderId });
});

// Step 2: Complete payment
app.post('/api/checkout/complete',
  shadowpay.requirePayment({ amount: 0.01, token: 'SOL' }),
  async (req, res) => {
    const { orderId } = req.body;
    
    await db.orders.update({
      where: { id: orderId },
      data: { status: 'completed' },
    });
    
    res.json({ success: true });
  }
);
```

## Subscription Payments

Implement recurring payments:

```typescript
// Monthly subscription check
app.get('/api/premium',
  async (req, res, next) => {
    const user = await db.users.findOne({ id: req.userId });
    
    // Check if subscription is active
    const now = Date.now();
    if (user.subscriptionExpiry > now) {
      return next(); // Subscription active
    }
    
    // Require payment for renewal
    return shadowpay.requirePayment({
      amount: 1,
      token: 'USDC',
      description: 'Monthly subscription',
    })(req, res, async () => {
      // Update subscription
      await db.users.update({
        where: { id: req.userId },
        data: {
          subscriptionExpiry: now + 30 * 24 * 60 * 60 * 1000, // +30 days
        },
      });
      next();
    });
  },
  (req, res) => {
    res.json({ premiumContent: '...' });
  }
);
```

## Custom Error Handling

Implement custom error handlers:

```typescript
import { ShadowPayError } from '@shadowpay/client';

async function handlePayment() {
  try {
    await shadowpay.pay({ ... });
  } catch (error) {
    if (error instanceof ShadowPayError) {
      switch (error.statusCode) {
        case 402:
          console.error('Payment required');
          break;
        case 401:
          console.error('Unauthorized');
          break;
        case 429:
          console.error('Rate limited');
          break;
        default:
          console.error('Payment failed:', error.message);
      }
    } else {
      console.error('Unknown error:', error);
    }
  }
}
```

## Proof Verification

Verify proofs locally before submission:

```typescript
import { verifyProof } from '@shadowpay/client';

// Generate proof
const { proof, publicSignals } = await generateProof({ ... });

// Verify locally
const isValid = await verifyProof(proof, publicSignals);

if (!isValid) {
  throw new Error('Invalid proof');
}

// Submit to API...
```

## Custom Commitment Schemes

For advanced cryptography users:

```typescript
import { generateCommitment, verifyCommitment } from '@shadowpay/core';

// Generate commitment with custom nonce
const commitment = await generateCommitment(
  1000000,
  'recipient',
  'SOL',
  'custom_nonce_123'
);

// Verify commitment
const isValid = await verifyCommitment(
  commitment.value,
  1000000,
  'recipient',
  'SOL',
  'custom_nonce_123'
);
```

## Network Configuration

### Mainnet (Production)

```typescript
const shadowpay = new ShadowPay({
  network: 'mainnet-beta',
  apiUrl: 'https://shadow.radr.fun',
});
```

### Devnet (Testing)

```typescript
const shadowpay = new ShadowPay({
  network: 'devnet',
  apiUrl: 'https://devnet.shadow.radr.fun',
});
```

⚠️ **Note:** Devnet support is limited. Use mainnet for production.

## Performance Optimization

### Proof Caching

Proofs are computationally expensive. Cache when possible:

```typescript
const proofCache = new Map();

async function getOrGenerateProof(inputs: ProofInputs) {
  const key = JSON.stringify(inputs);
  
  if (proofCache.has(key)) {
    return proofCache.get(key);
  }
  
  const proof = await generateProof(inputs);
  proofCache.set(key, proof);
  
  return proof;
}
```

### Parallel Payments

Make multiple payments in parallel:

```typescript
const payments = await Promise.all([
  shadowpay.pay({ to: 'merchant1', amount: 0.001, token: 'SOL', wallet }),
  shadowpay.pay({ to: 'merchant2', amount: 1, token: 'USDC', wallet }),
  shadowpay.pay({ to: 'merchant3', amount: 5, token: 'USDT', wallet }),
]);
```

## Security Best Practices

1. **Never expose private keys** - They're stored in localStorage, never transmit them
2. **Verify all payments server-side** - Never trust client-only verification
3. **Use HTTPS** - Always use HTTPS for API calls
4. **Rotate API keys** - Rotate keys periodically
5. **Monitor webhooks** - Watch for suspicious patterns
6. **Rate limit** - Implement rate limiting on protected endpoints
7. **Log everything** - Keep audit logs of all payments

## Debugging

Enable debug logging:

```typescript
// Client
localStorage.setItem('shadowpay_debug', 'true');

// Server
process.env.SHADOWPAY_DEBUG = 'true';
```

View logs:

```typescript
// Check payment history
console.log(shadowpay.getPaymentHistory());

// Check stored keys
console.log(localStorage.getItem('shadowpay_keys'));
```

## Migration Guide

### From v0.0.x to v0.1.x

No breaking changes. All APIs are backward compatible.

## Support

Need help with advanced features?

- 📧 support@shadow.radr.fun
- 💬 [Discord](https://discord.gg/shadowpay)
- 📚 [API Reference](./api-reference.md)
- 🐙 [GitHub](https://github.com/shadowpay/sdk)

