# Verify Aeon Setup Checklist

## ✅ Quick Verification Steps

### 1. Check Environment Variables

**Your `.env` file should have:**
```bash
VITE_ENABLE_AEON_PAYMENTS=true
VITE_AEON_APP_ID=TEST000001
CDP_API_KEY_ID=your-key-id
CDP_API_KEY_SECRET=your-secret
CDP_WALLET_SECRET=your-wallet-secret
```

**Verify they're loaded:**
```bash
# In terminal
cat .env | grep AEON
```

### 2. Restart Dev Server

After changing `.env`, you **MUST** restart:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 3. Check Browser Console

When you scan a QR code and click "Confirm Payment", you should see:

```javascript
Payment detection: {
  isAeonPaymentRequest: true,     // ← Should be true
  hasQrCode: true,                 // ← Should be true
  hasWalletAddress: true,          // ← Should be true
  appId: 'TEST000001',
  enableAeonByDefault: true,       // ← Should be true
  metadata: { ... }
}
Using Aeon payment service              // ← This confirms Aeon is active
Creating payment authorization...
Submitting payment to Aeon...
```

### 4. If Still Using Mock Payments

Check these in order:

**A. Environment variable not loaded?**
```typescript
// Add this console.log to payment-review.tsx line 59
console.log('ENV CHECK:', import.meta.env.VITE_ENABLE_AEON_PAYMENTS)
// Should log: ENV CHECK: true
```

**B. Not logged in with Privy?**
```typescript
// Check in payment-review.tsx
console.log('User wallet:', user?.wallet?.address)
// Should show your wallet address, not undefined
```

**C. QR code doesn't have resource?**
```typescript
// Check the QR code data
console.log('Payment Request:', paymentRequest)
// Should have: resource: "..." or metadata.qrCode: "..."
```

## 🔍 Debug Mode

Add detailed logging to see exactly what's happening:

### Option 1: Manual Test with Console

Open browser console and run:

```javascript
// Check if Aeon is enabled globally
console.log('Aeon enabled:', import.meta.env.VITE_ENABLE_AEON_PAYMENTS)

// Should output: true
```

### Option 2: Add Debug Logs

In [src/services/payment-service.ts](src/services/payment-service.ts), add:

```typescript
export async function executeAeonPayment(...) {
  console.log('🚀 executeAeonPayment called with:', { appId, qrCode: qrCode.substring(0, 20) + '...' })

  try {
    const client = new AeonX402Client(useSandbox)
    console.log('✅ AeonX402Client created')

    if (walletAddress) {
      client.setWallet(walletAddress as `0x${string}`)
      console.log('✅ Wallet set:', walletAddress)
    }

    console.log('📡 Calling getPaymentInfo...')
    const paymentInfo = await client.getPaymentInfo(appId, qrCode)
    console.log('✅ Got payment info:', paymentInfo)

    console.log('🔐 Creating X-PAYMENT header...')
    const xPaymentHeader = await client.createXPaymentHeader(aeonPaymentDetails)
    console.log('✅ X-PAYMENT header created (length):', xPaymentHeader.length)

    console.log('📤 Submitting payment...')
    const result = await client.submitPayment(appId, qrCode, xPaymentHeader)
    console.log('✅ Payment result:', result)

    return { success: true, ... }
  } catch (error) {
    console.error('❌ Payment error:', error)
  }
}
```

## 🎯 Expected Network Calls

When Aeon payment is active, you should see these network calls in browser DevTools (Network tab):

1. **First call (Get payment info):**
   ```
   GET https://ai-api.aeon.xyz/open/ai/402/payment
     ?appId=TEST000001
     &qrCode=...
     &address=0x...

   Response: 402 Payment Required
   ```

2. **Second call (Submit with X-PAYMENT):**
   ```
   GET https://ai-api.aeon.xyz/open/ai/402/payment
     ?appId=TEST000001
     &qrCode=...
     &address=0x...

   Headers:
     X-PAYMENT: eyJ4NDAyVmVyc2lvbiI6MSwi...

   Response: 200 OK
   ```

## 🐛 Common Issues

### Issue: "Using fallback payment simulation"

**Cause:** `isAeonPaymentRequest` is false

**Fix:**
```bash
# In .env
VITE_ENABLE_AEON_PAYMENTS=true

# Restart server
npm run dev
```

### Issue: "Wallet not initialized"

**Cause:** User not logged in or wallet address is undefined

**Fix:**
- Make sure you're logged in with Privy
- Check console: `user?.wallet?.address` should not be undefined

### Issue: Network calls to localhost instead of Aeon

**Cause:** `useSandbox` setting in payment-service.ts

**Fix:**
```typescript
// In src/services/payment-service.ts line 35
const useSandbox = false  // Use production: ai-api.aeon.xyz
```

### Issue: "Property 'env' does not exist"

**Cause:** TypeScript definitions missing

**Fix:** Already fixed in [src/vite-env.d.ts](src/vite-env.d.ts)

## ✅ Confirmation Test

**To confirm Aeon is working:**

1. Set `.env`:
   ```bash
   VITE_ENABLE_AEON_PAYMENTS=true
   ```

2. Restart dev server

3. Generate ANY QR code in the app

4. Scan it and click "Confirm Payment"

5. Check console - you should see:
   ```
   Using Aeon payment service
   🚀 executeAeonPayment called with: { appId: 'TEST000001', qrCode: '...' }
   ```

6. Check Network tab - you should see calls to `ai-api.aeon.xyz`

## 📊 Complete Flow Diagram

```
User Scans QR Code
       ↓
payment-review.tsx detects: isAeonPaymentRequest = true
       ↓
Calls executeAeonPayment() in payment-service.ts
       ↓
┌─────────────────────────────────────────┐
│ Step 1: client.getPaymentInfo()        │
│ → GET /open/ai/402/payment             │
│ ← 402 Response with payment details    │
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│ Step 2: client.createXPaymentHeader()  │
│ → Generate nonce                        │
│ → Create EIP-712 typed data             │
│ → Sign with CDP SDK                     │
│ → Build payload with signature          │
│ → Base64 encode                         │
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│ Step 3: client.submitPayment()         │
│ → GET /open/ai/402/payment             │
│ → With X-PAYMENT header                │
│ ← 200 OK with txHash                   │
└─────────────────────────────────────────┘
       ↓
Payment Success! 🎉
```

## 🔧 Quick Fix Script

If nothing works, try this:

```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Verify .env
cat .env

# 3. Restart fresh
npm run dev
```

## 📞 Still Not Working?

If you've checked everything above and it's still using mock payments:

1. Share your `.env` file content (remove sensitive keys)
2. Share browser console output when clicking "Confirm Payment"
3. Share Network tab showing API calls

The code is **definitely** creating and sending X-PAYMENT headers - it just needs to be triggered with the right conditions!
