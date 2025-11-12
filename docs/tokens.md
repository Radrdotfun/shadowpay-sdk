# Multi-Token Support

ShadowPay supports multiple tokens on Solana.

## Supported Tokens

| Token | Symbol | Mint Address | Decimals |
|-------|--------|--------------|----------|
| Solana | `SOL` | `So11111111111111111111111111111111111111112` | 9 |
| USD Coin | `USDC` | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | 6 |
| Tether USD | `USDT` | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` | 6 |

## Usage

### Client SDK

Specify token in payment options:

```typescript
// Pay with SOL (default)
await shadowpay.pay({
  to: 'merchant',
  amount: 0.001,
  token: 'SOL',
  wallet,
});

// Pay with USDC
await shadowpay.pay({
  to: 'merchant',
  amount: 1.0,
  token: 'USDC',
  wallet,
});

// Pay with USDT
await shadowpay.pay({
  to: 'merchant',
  amount: 5.0,
  token: 'USDT',
  wallet,
});
```

### Server SDK

Specify token in payment requirement:

```typescript
// Require SOL payment
app.get('/api/sol',
  shadowpay.requirePayment({ amount: 0.001, token: 'SOL' }),
  (req, res) => res.json({ data: 'SOL content' })
);

// Require USDC payment
app.get('/api/usdc',
  shadowpay.requirePayment({ amount: 1, token: 'USDC' }),
  (req, res) => res.json({ data: 'USDC content' })
);

// Require USDT payment
app.get('/api/usdt',
  shadowpay.requirePayment({ amount: 5, token: 'USDT' }),
  (req, res) => res.json({ data: 'USDT content' })
);
```

## Token Configuration

Access token configuration:

```typescript
import { TOKENS, getTokenConfig } from '@shadowpay/core';

// Get all tokens
console.log(TOKENS.SOL);  // { symbol: 'SOL', mint: '...', decimals: 9 }
console.log(TOKENS.USDC); // { symbol: 'USDC', mint: '...', decimals: 6 }
console.log(TOKENS.USDT); // { symbol: 'USDT', mint: '...', decimals: 6 }

// Get specific token
const config = getTokenConfig('USDC');
console.log(config.decimals); // 6
```

## Amount Conversion

Convert between human-readable amounts and lamports:

```typescript
import { parseAmount, formatAmount } from '@shadowpay/core';

// Human-readable to lamports
const solLamports = parseAmount(0.001, 'SOL');   // 1000000 (9 decimals)
const usdcLamports = parseAmount(1, 'USDC');     // 1000000 (6 decimals)
const usdtLamports = parseAmount(5, 'USDT');     // 5000000 (6 decimals)

// Lamports to human-readable
const solAmount = formatAmount(1000000, 'SOL');   // 0.001
const usdcAmount = formatAmount(1000000, 'USDC'); // 1.0
const usdtAmount = formatAmount(5000000, 'USDT'); // 5.0
```

## Decimal Handling

Different tokens have different decimal places:

- **SOL:** 9 decimals (1 SOL = 1,000,000,000 lamports)
- **USDC:** 6 decimals (1 USDC = 1,000,000 micro-USDC)
- **USDT:** 6 decimals (1 USDT = 1,000,000 micro-USDT)

The SDK handles this automatically!

## Pricing Examples

### SOL Pricing

```typescript
// Micro-payments
{ amount: 0.001, token: 'SOL' }   // ~$0.10 (at $100/SOL)
{ amount: 0.01, token: 'SOL' }    // ~$1.00
{ amount: 0.1, token: 'SOL' }     // ~$10.00
{ amount: 1, token: 'SOL' }       // ~$100.00
```

### Stablecoin Pricing

```typescript
// USD-pegged (stable)
{ amount: 0.1, token: 'USDC' }    // $0.10
{ amount: 1, token: 'USDC' }      // $1.00
{ amount: 10, token: 'USDC' }     // $10.00
{ amount: 100, token: 'USDC' }    // $100.00

// Same for USDT
{ amount: 1, token: 'USDT' }      // $1.00
{ amount: 5, token: 'USDT' }      // $5.00
```

## Best Practices

### 1. Use Stablecoins for Fixed Pricing

```typescript
// ✅ Good: Predictable pricing
app.get('/api/article',
  shadowpay.requirePayment({ amount: 1, token: 'USDC' }),
  handler
);

// ❌ Avoid: Volatile pricing
app.get('/api/article',
  shadowpay.requirePayment({ amount: 0.01, token: 'SOL' }),
  handler
);
```

### 2. Offer Multiple Payment Options

```typescript
// Let users choose their preferred token
app.get('/api/premium/sol',
  shadowpay.requirePayment({ amount: 0.01, token: 'SOL' }),
  handler
);

app.get('/api/premium/usdc',
  shadowpay.requirePayment({ amount: 1, token: 'USDC' }),
  handler
);
```

### 3. Handle Token in Webhooks

```typescript
shadowpay.webhooks.handler((event) => {
  console.log(`Received ${event.data.amount} ${event.data.token}`);
  
  // Different logic per token
  if (event.data.token === 'SOL') {
    // Handle SOL payment
  } else if (event.data.token === 'USDC') {
    // Handle USDC payment
  }
});
```

## Custom Tokens (Coming Soon)

Support for custom SPL tokens will be added in a future release:

```typescript
// Future API
import { addCustomToken } from '@shadowpay/core';

addCustomToken({
  symbol: 'BONK',
  mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  decimals: 5,
  name: 'Bonk',
});
```

## Token Discovery

Get list of supported tokens:

```typescript
import { getSupportedTokens } from '@shadowpay/core';

const tokens = getSupportedTokens();
// [
//   { symbol: 'SOL', mint: '...', decimals: 9 },
//   { symbol: 'USDC', mint: '...', decimals: 6 },
//   { symbol: 'USDT', mint: '...', decimals: 6 },
// ]
```

## FAQ

**Q: Can I accept multiple tokens for the same content?**  
A: Yes! Create multiple endpoints or check the token in your handler.

**Q: Which token is most popular?**  
A: USDC is most popular for fixed-price content. SOL is popular for micro-payments.

**Q: Are tokens converted automatically?**  
A: No, each token is handled independently. Users pay with the exact token you specify.

**Q: Can I change token prices dynamically?**  
A: Yes, generate payment requirements dynamically based on current prices.

**Q: What about gas fees?**  
A: Solana fees are ~$0.00025 per transaction, negligible for most use cases.

## Support

Need help with tokens?

- 📧 support@shadow.radr.fun
- 💬 [Discord](https://discord.gg/shadowpay)

