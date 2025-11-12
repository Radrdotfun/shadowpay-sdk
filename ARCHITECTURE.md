# 🏗️ ShadowPay Architecture: Instant Access + Deferred ZK Proof

## 🎯 Key Insight: Deferred ZK ≠ No ZK

**Deferred ZK proof means:**
- ✅ User doesn't wait for proof (instant access in 100-200ms)
- ✅ Proof **STILL generates** in background (15-30s)
- ✅ Privacy **STILL preserved** on-chain (ZK proof used for settlement)

---

## 🔐 Why ZK Proofs Are Critical

### WITHOUT ZK Proof (Direct Transfer):
```
User_Wallet → Merchant_Wallet (1,000,000 lamports)
     ↑              ↑
  PUBLIC!       PUBLIC!

❌ No privacy
❌ Amount visible
❌ Sender visible
❌ Just a regular Solana transfer
```

### WITH Deferred ZK Proof (ShadowPay):
```
Step 1 (Instant):
User → Balance Check → JWT Token → Access Granted ✅
           (100ms)

Step 2 (Background, 15-30s later):
Client → Generate ZK Proof → Relayer → Escrow_PDA → Merchant
                                             ↑            ↑
                                        Anonymous!  Amount encrypted!

✅ Privacy preserved
✅ Amount hidden (ElGamal encryption)
✅ Sender anonymous (relayer settlement)
✅ ZK proof verifies payment without revealing details
```

---

## 📊 Payment Flow (Step-by-Step)

### **Client Side (User's Browser):**

```typescript
// 1. ⚡ INSTANT: Authorize payment (100-200ms)
const auth = await api.authorize({
  apiKey: merchantKey,           // For authentication
  userWallet: userWallet,         // Balance check only
  merchantWallet: merchantWallet, // Where payment goes
  amount: 1000000,                // Amount in lamports
});

// 2. ✅ User gets access IMMEDIATELY
return {
  accessToken: auth.access_token,  // Use this right away!
  status: 'authorized',
  proofPending: true,              // Proof generating in background
};

// 3. 🔐 Background: Generate ZK proof (15-30s, non-blocking)
this.generateProofInBackground(auth).then(settlement => {
  console.log('✅ Privacy proof complete!', settlement.signature);
  // User already has access, this just finalizes privacy
});
```

### **Backend (shadow.radr.fun):**

```
POST /shadowpay/v1/payment/authorize
├─ Headers: X-API-Key: 2hTKeADLwNZPeU5MeFcNKV4ttfWtpBUSEMiRVf4jRyjC
├─ Body: { user_wallet, merchant, amount }
└─ Response (100ms):
   {
     "commitment": "commitment_01K9...",
     "nullifier": "nullifier_01K9...",
     "access_token": "eyJhbG...",    ← User uses this immediately!
     "expires_at": 1762534760,
     "proof_deadline": 1762534750     ← Proof must submit before this
   }

POST /shadowpay/v1/payment/settle (15-30s later)
├─ Body: { commitment, proof, publicSignals }
└─ Response:
   {
     "success": true,
     "signature": "5X7vQ...",        ← On-chain settlement (private!)
     "settlement_time": 1762534770
   }
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ USER CLICKS "UNLOCK FOR 0.001 SOL"                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ 1. AUTHORIZE  │  ⚡ 100-200ms
         │ Balance Check │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │ 2. JWT TOKEN  │  ✅ Instant Access!
         │ User gets     │
         │ access NOW    │
         └───────┬───────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌─────────────┐      ┌─────────────────┐
│ USER SEES   │      │ BACKGROUND:     │
│ CONTENT     │      │ Generate ZK     │
│ IMMEDIATELY │      │ Proof (15-30s)  │ 🔐 Privacy!
└─────────────┘      └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ 3. SETTLE       │
                     │ Submit proof    │
                     │ to blockchain   │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ ✅ SETTLED      │
                     │ Private payment │
                     │ on-chain        │
                     └─────────────────┘
```

---

## 🛡️ What Each Component Provides

| Component | Purpose | Privacy | Latency |
|-----------|---------|---------|---------|
| **Balance Check** | Instant auth | ❌ Off-chain only | 100ms |
| **JWT Token** | Access control | ❌ Off-chain only | 100ms |
| **ZK Proof** | On-chain privacy | ✅ **CRITICAL** | 15-30s |
| **Relayer Settlement** | Hide sender | ✅ Works with ZK | 1-2s |

---

## ⚠️ What Happens if ZK Proof Generation Fails?

```typescript
try {
  const proof = await generateZKProof({...});
  await settler.settle({ proof });
  console.log('✅ Settled with privacy');
} catch (error) {
  console.error('❌ Proof generation failed');
  
  // Options:
  // 1. Revoke access (user loses access, merchant loses nothing)
  // 2. Fallback to non-private settlement (merchant choice)
  // 3. Retry proof generation (recommended)
}
```

**Merchant choices:**
- ✅ **Revoke access** = Secure, user loses access if proof fails
- ⚠️ **Keep access** = User keeps access, but payment may not settle
- 🔄 **Retry** = Give user more time to generate proof

---

## 🎯 Key Takeaways

1. **Instant Access ≠ No Privacy**
   - User gets access in 100ms
   - Privacy is preserved via background ZK proof

2. **ZK Proof is NOT Optional**
   - Required for on-chain privacy
   - Hides amount, sender, and transaction details
   - Without it, it's just a regular Solana transfer

3. **Background Generation Benefits:**
   - ✅ Better UX (no 30s wait)
   - ✅ Same privacy (ZK proof still generated)
   - ✅ Merchant protected (can revoke if proof fails)

4. **The Privacy Model:**
   - User → Escrow PDA (via ZK proof)
   - Relayer → Merchant (breaks on-chain link)
   - Amount encrypted (ElGamal on BN254)
   - Sender anonymous (relayer acts on behalf)

---

## 🚀 Implementation Status

✅ **Completed:**
- Instant authorization (100-200ms)
- JWT access token
- Background ZK proof generation
- ElGamal encryption
- Poseidon hashing
- Groth16 ZK proofs
- Settlement endpoint

🔄 **In Progress:**
- Circuit input formatting (merkle proof, salt from API)
- ElGamal randomness capture
- Settlement status polling

📝 **TODO:**
- Error handling for proof failures
- Retry logic for failed proofs
- Merchant revocation API

---

## 📚 References

- [ZK Proofs on Solana](https://docs.solana.com)
- [Groth16 Proving System](https://github.com/iden3/snarkjs)
- [ElGamal Encryption on BN254](https://github.com/paulmillr/noble-curves)
- [Poseidon Hash Function](https://github.com/iden3/circomlibjs)

---

**Built with ❤️ for privacy-preserving payments on Solana**

