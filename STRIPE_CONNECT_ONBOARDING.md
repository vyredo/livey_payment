# Stripe Connect Onboarding Guide

## Overview

This guide explains how sellers complete Stripe Connect onboarding to receive payments through your platform.

## Current Seller Information

- **Email**: `vidy.alfredo1@gmail.com`
- **Seller ID**: `b06e4064-b18a-4579-a431-ed93830c2eef`
- **Status**: Pending onboarding

---

## Complete Onboarding Process

### Step 1: Generate Onboarding Link

Run the test script to generate a unique onboarding URL:

```bash
node test_seller_onboarding.js
```

This will:

- Create a Stripe Express Connect account
- Generate a secure onboarding URL
- Display the URL for the seller to complete onboarding

### Step 2: Seller Completes Stripe Form

The seller must visit the onboarding URL and provide:

#### 🏢 Business Information

- Business type (Individual or Company)
- Business name
- Business address
- Business website (optional)
- Industry/product description

#### 👤 Personal Information

- Full legal name (as appears on government ID)
- Date of birth
- Home address
- Social Security Number (SSN) or Tax ID (for US)
- Phone number

#### 🏦 Bank Account Details

- Bank name
- Account holder name
- Routing number
- Account number
- Account type (checking/savings)

#### 📄 Identity Verification

Upload one of the following:

- Driver's license (front and back)
- Passport
- Government-issued ID

#### 🏢 Business Documentation (if company)

- Employer Identification Number (EIN)
- Business registration documents
- Articles of incorporation

### Step 3: Review & Verification

After submission:

- **Instant Review**: Some accounts are approved immediately
- **Manual Review**: May take 1-2 business days
- **Additional Info**: Stripe may request more documents

### Step 4: Completion

Once approved:

- ✅ `stripeOnboardingCompleted` = true
- ✅ `stripeAccountStatus` = "enabled"
- ✅ `charges_enabled` = true
- ✅ Ready to receive payments!

---

## Check Onboarding Status

Run the status check script anytime:

```bash
node check_seller_status.js
```

This shows:

- Current onboarding status
- Stripe account status
- Whether charges are enabled
- Live status from Stripe API

---

## Key Stripe Connect Features

### 🔐 Express Account Type

Your implementation uses **Stripe Express** accounts, which provide:

- Simplified onboarding flow
- Stripe-hosted onboarding form
- Automatic compliance handling
- Built-in fraud protection
- Direct bank transfers

### 💰 Payment Flow

1. Customer pays for order
2. Platform (you) receives full payment
3. Platform fee deducted (2% + $0.30)
4. Remaining amount transferred to seller's account
5. Funds available in seller's bank account in 2-7 days

### 📊 Seller Dashboard Access

After onboarding, sellers can access their Stripe Dashboard:

```javascript
// Your API endpoint: POST /api/payments/portal
{
  "sellerId": "b06e4064-b18a-4579-a431-ed93830c2eef"
}
```

This provides sellers access to:

- Transaction history
- Payout schedule
- Tax documents
- Payment settings
- Customer disputes

---

## Common Issues & Solutions

### ❌ Onboarding Incomplete

**Problem**: Seller didn't finish the form  
**Solution**: Call `/api/payments/onboard` again to generate a new link

### ⚠️ Account Restricted

**Problem**: `stripeAccountStatus` = "restricted"  
**Reasons**:

- Missing required information
- Failed identity verification
- Bank account verification pending
**Solution**: Contact seller to complete missing information

### 🚫 Charges Disabled

**Problem**: `charges_enabled` = false  
**Reasons**:

- Onboarding not complete
- Under review by Stripe
- Compliance issues
**Solution**: Wait for Stripe review or check email for action items

---

## API Integration Details

### Create Onboarding Link

```javascript
POST /api/payments/onboard
{
  "sellerId": "b06e4064-b18a-4579-a431-ed93830c2eef",
  "refreshUrl": "https://yourapp.com/onboarding-refresh",
  "returnUrl": "https://yourapp.com/onboarding-complete"
}
```

**Response**:

```json
{
  "success": true,
  "url": "https://connect.stripe.com/setup/...",
  "accountId": "acct_xxxxxxxxxxxxx"
}
```

### Check Account Status

```javascript
GET /api/payments/callback?sellerId=b06e4064-b18a-4579-a431-ed93830c2eef
```

**Response**:

```json
{
  "success": true,
  "status": {
    "id": "acct_xxxxxxxxxxxxx",
    "charges_enabled": true,
    "details_submitted": true
  }
}
```

### Create Payment Intent

```javascript
POST /api/payments/create-intent
{
  "orderId": "order_id_here"
}
```

**Requirements**:

- Seller must have `stripeOnboardingCompleted` = true
- Seller must have `stripeAccountStatus` = "enabled"

---

## Testing Onboarding

### Development Mode

In test mode, you can use Stripe's test data:

- **Test SSN**: `000-00-0000`
- **Test Routing**: `110000000`
- **Test Account**: `000123456789`

### Production Mode

- Use real information
- Provide actual documents
- Allow 1-2 days for verification

---

## Monitoring & Maintenance

### Regular Checks

- Monitor seller status regularly
- Check for account restrictions
- Verify payout schedules
- Review transaction fees

### Webhooks (Optional Enhancement)

Consider implementing webhooks for:

- `account.updated` - Account status changes
- `account.application.deauthorized` - Account disconnected
- `capability.updated` - Payment capability changes

---

## Support & Resources

### Stripe Documentation

- [Stripe Connect Overview](https://stripe.com/docs/connect)
- [Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Account Onboarding](https://stripe.com/docs/connect/onboarding)

### Your Platform Support

- Email: <support@yourplatform.com>
- Documentation: <https://docs.yourplatform.com>
- Status: Check with `node check_seller_status.js`

---

## Quick Start Commands

```bash
# 1. Generate onboarding link
node test_seller_onboarding.js

# 2. Seller completes form at the provided URL

# 3. Check status
node check_seller_status.js

# 4. Once approved, create orders and payments
node check_order.js
```

---

## Security Notes

⚠️ **Important Security Considerations**:

- Never store sensitive bank/identity information in your database
- All sensitive data is handled by Stripe
- Use HTTPS for all API calls
- Validate seller identity before allowing access
- Monitor for suspicious activity
- Comply with PCI DSS requirements

---

## Next Steps

After successful onboarding:

1. ✅ Seller can receive payments
2. ✅ Create orders for this seller
3. ✅ Generate payment intents
4. ✅ Process customer payments
5. ✅ Seller receives automatic payouts
