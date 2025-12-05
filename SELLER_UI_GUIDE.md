# Seller Onboarding UI Guide

## Accessing the Onboarding Page

The seller onboarding UI is now available in your application. There are two ways to access it:

### Option 1: Navigation Link

Click the **"Seller Onboarding"** link in the top-right corner of the header on any page.

### Option 2: Direct URL

Navigate to: `http://localhost:5173/seller-onboarding`

---

## How It Works

### Step 1: Find Your Seller Account

1. Open the seller onboarding page
2. Enter the seller's email address (`vidy.alfredo1@gmail.com`)
3. Click **"Continue"**

### Step 2: Connect with Stripe

Once the seller account is found, you'll see:

- Seller information (email, business name, seller ID)
- A **"Connect with Stripe"** button (if not yet connected)
- Current connection status badge

### Step 3: Complete Stripe Onboarding

1. Click the **"Connect with Stripe"** button
2. You'll be redirected to Stripe's secure onboarding form
3. Complete the required information:
   - Business details
   - Personal information
   - Bank account details
   - Identity verification
4. After completion, you'll be redirected back to your app

### Step 4: Start Receiving Payments

Once onboarding is complete:

- Status changes to **"Active"**
- The button changes to **"Open payout dashboard"**
- Seller can now receive payments through your platform

---

## Features

### For Sellers Not Yet Connected

- **Status Badge**: Shows "Not connected" or "Onboarding in progress"
- **Connect Button**: Initiates Stripe Connect onboarding
- **Secure Process**: All sensitive data handled by Stripe
- **No Manual Entry**: Auto-creates Stripe Express account

### For Connected Sellers

- **Status Badge**: Shows "Active", "Restricted", or current status
- **Dashboard Access**: Direct link to Stripe Express dashboard
- **Payout Information**: View transactions, payouts, and tax documents
- **Account Management**: Update bank account and business details

---

## Testing with Your Seller

### For `vidy.alfredo1@gmail.com`

1. **Start the development server** (if not running):

   ```bash
   npm run dev
   ```

2. **Access the UI**:
   - Open: `http://localhost:5173/seller-onboarding`
   - Enter email: `vidy.alfredo1@gmail.com`
   - Click "Continue"

3. **Click "Connect with Stripe"**:
   - This creates a Stripe Express account
   - You'll be redirected to Stripe's onboarding

4. **Complete Stripe Form**:
   - In **test mode**, use test data:
     - SSN: `000-00-0000`
     - Routing: `110000000`
     - Account: `000123456789`
   - In **production**, use real information

5. **Return to Platform**:
   - After completion, you're redirected back
   - Status updates automatically
   - Ready to create orders and process payments

---

## URL Patterns

The page supports multiple URL patterns:

### 1. Email Search

```
http://localhost:5173/seller-onboarding
```

Shows email input form to search for seller.

### 2. Direct Access with Seller ID

```
http://localhost:5173/seller-onboarding?sellerId=b06e4064-b18a-4579-a431-ed93830c2eef
```

Automatically loads the seller's information.

### 3. Return from Stripe

```
http://localhost:5173/api/payments/callback?sellerId=b06e4064-b18a-4579-a431-ed93830c2eef
```

API endpoint that updates seller status after onboarding.

---

## API Endpoints Used

The UI interacts with these backend endpoints:

### Get Seller by Email

```
GET /api/sellers/by-email/:email
```

### Get Seller by ID

```
GET /api/sellers/:id
```

### Start Onboarding

```
POST /api/payments/onboard
{
  "sellerId": "seller-uuid",
  "refreshUrl": "return-url-if-aborted",
  "returnUrl": "return-url-after-completion"
}
```

### Open Dashboard

```
POST /api/payments/portal
{
  "sellerId": "seller-uuid"
}
```

---

## Status Indicators

The UI displays different status badges:

| Status | Badge Color | Meaning |
|--------|-------------|---------|
| Not connected | Gray/Outline | No Stripe account yet |
| Onboarding in progress | Yellow | Stripe account created, onboarding incomplete |
| Active | Green | Fully onboarded, can receive payments |
| Restricted | Red | Account has issues or restrictions |

---

## Security Notes

✅ **Secure by Design**:

- All sensitive data handled by Stripe
- No payment information stored in your database
- HTTPS required for production
- PCI DSS compliant through Stripe

✅ **Privacy Protected**:

- Only seller email and ID stored locally
- Bank details never touch your servers
- Identity verification managed by Stripe
- Automatic fraud detection by Stripe

---

## Troubleshooting

### "Seller not found"

- Verify the email address is correct
- Check if seller exists in database
- Create seller using: `node test_seller_onboarding.js`

### "Failed to create onboarding link"

- Check STRIPE_SECRET_KEY is set
- Verify Stripe API is accessible
- Check server logs for errors

### "Onboarding in progress" stuck

- Seller may not have completed the form
- Generate a new onboarding link (click button again)
- Check Stripe Dashboard for pending onboarding

### Status not updating

- Click "Switch Account" and re-enter email
- Check API logs for callback errors
- Verify webhook configuration (if using)

---

## Next Steps

After successful onboarding:

1. ✅ Seller is ready to receive payments
2. ✅ Create orders for this seller
3. ✅ Generate payment intents
4. ✅ Process customer payments
5. ✅ Seller receives automatic payouts

### Create an Order

Go to the home page and create an order for this seller's email.

### Process a Payment

Navigate to the checkout page and complete the payment.

### View Dashboard

Seller can click "Open payout dashboard" to view transactions.

---

## Production Checklist

Before going live:

- [ ] Switch Stripe keys to production mode
- [ ] Enable HTTPS for all endpoints
- [ ] Configure proper return URLs
- [ ] Set up webhook endpoints
- [ ] Test with real bank account
- [ ] Verify payout schedule
- [ ] Review Stripe compliance requirements
- [ ] Add seller authentication/authorization
- [ ] Implement rate limiting
- [ ] Set up monitoring and alerts
