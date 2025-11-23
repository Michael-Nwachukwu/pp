# Aeon x402 Payment Integration Guide

## Overview

Aeon is a **payment verification and processing layer** that enables crypto-to-fiat payments. It acts as a bridge between fiat payment systems (like VietQR) and blockchain payments.

## How Aeon Works

### The Flow

```
Fiat QR Code (VietQR) → Aeon API → Crypto Payment → Fiat Settlement
```

1. **User scans a fiat QR code** (e.g., VietQR for Vietnamese payments)
2. **App calls Aeon** with the QR code string to get payment details
3. **Aeon responds** with blockchain payment requirements (402 Payment Required)
4. **App creates X-PAYMENT header** with signed authorization
5. **App submits payment** to Aeon with X-PAYMENT header
6. **Aeon processes** the crypto payment and handles fiat settlement

## Configuration

### 1. Environment Variables

Add to your `.env` file:

```bash
# Enable Aeon payment processing
VITE_ENABLE_AEON_PAYMENTS=true

# Your Aeon App ID (TEST000001 for sandbox)
VITE_AEON_APP_ID=TEST000001

# CDP API credentials (for signing)
CDP_API_KEY_ID=your-key-id
CDP_API_KEY_SECRET=your-secret
CDP_WALLET_SECRET=your-wallet-secret
```

### 2. Sandbox vs Production

In [src/services/payment-service.ts](src/services/payment-service.ts#L30):

```typescript
const useSandbox = true  // true = sandbox, false = production
```

- **Sandbox**: `https://ai-api-sbx.aeon.xyz`
- **Production**: `https://ai-api.aeon.xyz`

## Testing Aeon Payments

### Method 1: Enable for All Payments (Recommended for Testing)

1. Set in `.env`:
   ```bash
   VITE_ENABLE_AEON_PAYMENTS=true
   ```

2. Generate any QR code in the app
3. Scan it - it will automatically use Aeon API

### Method 2: Scan External Aeon QR Code

1. Get a fiat QR code (e.g., VietQR):
   ```
   00020101021138560010A0000007270126000697041501121170028740400208QRIBFTTA53037045802VN63048A1C
   ```

2. Create an x402 QR code with this as the resource:
   ```typescript
   const paymentRequest = {
     maxAmountRequired: "550000",
     resource: "00020101021138560010A0000007270126...", // The fiat QR code
     payTo: "0x302bb114079532dfa07f2dffae320d04be9d903b",
     asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
     network: "base",
     metadata: {
       provider: "aeon",  // Mark as Aeon payment
       appId: "TEST000001"
     }
   }
   ```

3. Encode and generate QR code
4. Scan and pay!

## API Parameters Explained

### Required Parameters for Aeon API

| Parameter | Description | Example |
|-----------|-------------|---------|
| `appId` | Merchant identifier | `TEST000001` |
| `qrCode` | Fiat QR code string | `00020101021138560010A000...` |
| `address` | **Payer's** wallet address | `0xa0a35e76e4476bd62fe452...` |

### Important Notes

- **`address`** = The person **paying** (your wallet)
- **`qrCode`** = The fiat payment QR code (e.g., VietQR, not the x402 QR)
- **`appId`** = Merchant/application ID (can be any string for testing, or assigned by Aeon)

## Understanding the Two-Step Process

### Step 1: Get Payment Information (402 Response)

**Request:**
```bash
GET https://ai-api-sbx.aeon.xyz/open/ai/402/payment
  ?appId=TEST000001
  &qrCode=00020101021138560010A0000007270126...
  &address=0xace****
```

**Response (HTTP 402):**
```json
{
  "code": "402",
  "msg": "X-PAYMENT header is required",
  "x402Version": "1",
  "accepts": [{
    "maxAmountRequired": "550000",
    "payTo": "0x302bb114079532dfa07f2dffae320d04be9d903b",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "network": "base",
    "scheme": "exact",
    "maxTimeoutSeconds": 60,
    "extra": {
      "orderNo": "400017533497667631733",
      "name": "USD Coin"
    }
  }]
}
```

### Step 2: Submit Payment with X-PAYMENT Header

**Request:**
```bash
GET https://ai-api-sbx.aeon.xyz/open/ai/402/payment
  ?appId=TEST000001
  &qrCode=00020101021138560010A0000007270126...
  &address=0xace****
--header 'X-PAYMENT: eyJ4NDAyVmVyc2lvbiI6MSwic2NoZW1lIjoiZXhhY3QiLCJuZXR3b3JrIjoiYmFzZSIsInBheWxvYWQiOnsic2lnbmF0dXJlIjoiMHg3YzNhZTk0Y2QxZDRkOGVkYzQ1NzIwMDdiMjU0MmU1ZWEwNGIxYTlkODdkMjdjMjFmMzRmZGY2YTY1MTFjODc0MzBjMjc3MzBiZDlmNTJhN2Y5ZjhhMTdmNWRjYmQ5NjcyNWU4NzFhYmU1ZGUwOTYwZDAxMTJjOWRjNGFkNWEzNjFjIiwiYXV0aG9yaXphdGlvbiI6eyJmcm9tIjoiMHhhMGEzNWU3NmU0NDc2YmQ2MmZlNDUyODk5YWY3YWVhNmQxYjIwYWI3IiwidG8iOiIweDcxY2Q1MWZkMjc4N2QxODNmOTE3YjNlMTExOTkwODcyMTljM2M2MzgiLCJ2YWx1ZSI6IjU1MDAwMCIsInZhbGlkQWZ0ZXIiOiIxNzUzMzQ4OTQ4IiwidmFsaWRCZWZvcmUiOiIxNzUzMzQ5MDY4Iiwibm9uY2UiOiIweGYzOTIwNjBlMDRmMTljMDM3MTkwNzc0NGFmMTMxYzgxYWY0ZTQ3N2NkYzg1ZjU2MjdkNmYxYjIyODEyZTRjODgifX19'
```

**Response (HTTP 200):**
```json
{
  "code": "0",
  "msg": "success",
  "model": {
    "num": "400017533502624591734",
    "status": "SUCCESS",
    "usdAmount": 0.53498098,
    "orderAmount": 14070.00000000,
    "orderCurrency": "VND",
    "qrCode": "00020101021138560010A0000007270126...",
    "txHash": "0x..." // Added in X-Payment-Response header
  }
}
```

## X-PAYMENT Header Format

The header contains a base64-encoded JSON payload:

```json
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "base",
  "payload": {
    "signature": "0x7c3ae94cd1d4d8edc457200...",
    "authorization": {
      "from": "0xa0a35e76e4476bd62fe452899af7aea6d1b20ab7",  // Payer
      "to": "0x71cd51fd2787d183f917b3e111990872194c3c638",    // Recipient
      "value": "550000",                                       // Amount
      "validAfter": "1753348948",                              // Start timestamp
      "validBefore": "1753349068",                             // End timestamp
      "nonce": "0xf392060e04f19c037190774..."                 // Random nonce
    }
  }
}
```

## How the App Creates X-PAYMENT Headers

The app automatically:

1. **Calls Aeon API** to get payment details (`getPaymentInfo()`)
2. **Generates a random nonce**
3. **Creates EIP-712 typed data** for USDC transfer authorization
4. **Signs with CDP SDK** using `cdp.evm.signTypedData()`
5. **Builds the payload** with signature + authorization
6. **Base64 encodes** the payload
7. **Submits to Aeon** with X-PAYMENT header

All handled by [src/services/aeon-x402-clientt.ts](src/services/aeon-x402-clientt.ts) and [src/services/payment-service.ts](src/services/payment-service.ts).

## Troubleshooting

### Payment still using mock/simulation

**Check these:**

1. **Environment variable set?**
   ```bash
   # In .env
   VITE_ENABLE_AEON_PAYMENTS=true
   ```

2. **CDP credentials configured?**
   ```bash
   CDP_API_KEY_ID=...
   CDP_API_KEY_SECRET=...
   CDP_WALLET_SECRET=...
   ```

3. **Check console logs:**
   ```javascript
   // Should see:
   Payment detection: {
     isAeonPaymentRequest: true,
     hasQrCode: true,
     hasWalletAddress: true,
     appId: 'TEST000001',
     enableAeonByDefault: true
   }
   Using Aeon payment service
   ```

4. **Sandbox mode correct?**
   ```typescript
   // In src/services/payment-service.ts
   const useSandbox = true  // Should match your API endpoint
   ```

### 402 Error from Aeon

This is **expected** on the first call! The 402 response contains payment details. The app then creates the X-PAYMENT header and retries.

### Signature validation failed

- Check CDP credentials are correct
- Verify wallet has permission to sign
- Check nonce is unique
- Ensure timestamps are valid (not expired)

## Example: Complete Test Flow

1. **Setup environment:**
   ```bash
   VITE_ENABLE_AEON_PAYMENTS=true
   VITE_AEON_APP_ID=TEST000001
   CDP_API_KEY_ID=...
   CDP_API_KEY_SECRET=...
   CDP_WALLET_SECRET=...
   ```

2. **Start app:**
   ```bash
   npm run dev
   ```

3. **Login with Privy** to get a wallet address

4. **Generate a test QR code:**
   - Amount: 0.55
   - Token: USDC
   - Network: Base Sepolia

5. **Scan the QR code** in the app

6. **Watch the console** for Aeon API calls:
   ```
   Payment detection: { isAeonPaymentRequest: true, ... }
   Using Aeon payment service
   Creating payment authorization...
   Submitting payment to Aeon...
   ```

7. **Payment should complete** and show transaction hash!

## Production Checklist

Before going to production:

- [ ] Get production Aeon App ID
- [ ] Set `useSandbox = false` in payment-service.ts
- [ ] Use production CDP API keys
- [ ] Test with real USDC amounts
- [ ] Verify transaction receipts on blockchain
- [ ] Set up proper error handling
- [ ] Monitor for failed payments
- [ ] Test timeout scenarios

## Support & Resources

- **Aeon API Docs**: https://aeon-xyz.readme.io/docs/x402-qr-code-payment
- **CDP SDK Docs**: https://docs.cdp.coinbase.com/
- **EIP-712 Spec**: https://eips.ethereum.org/EIPS/eip-712

## Summary

- ✅ Aeon is a verification layer, not a QR code generator
- ✅ Set `VITE_ENABLE_AEON_PAYMENTS=true` to enable for all payments
- ✅ `address` parameter = payer's wallet (your wallet)
- ✅ `qrCode` parameter = fiat QR code string (e.g., VietQR)
- ✅ App automatically creates and signs X-PAYMENT headers
- ✅ Works with base and base-sepolia networks
