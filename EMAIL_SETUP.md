# Email Setup Guide

The application now automatically sends payment links to buyers via email when orders are created.

## Features

✅ **Console Logging** - Payment links are always logged to the browser console when orders are created
✅ **Email Notifications** - Payment links are sent to the buyer's email (optional)

## Email Configuration (Optional)

Email sending is **optional**. If not configured, the payment link will only be logged to the console.

### Setup Instructions

1. **Choose an Email Provider**

For Gmail (recommended for testing):

- Use your Gmail account
- Generate an App Password (not your regular password)
- Enable 2FA on your Google account
- Go to: <https://myaccount.google.com/apppasswords>
- Generate a new App Password for "Mail"

For other providers:

- SMTP servers: Mailgun, SendGrid, AWS SES, etc.
- Get SMTP credentials from your provider

2. **Update Environment Variables**

Edit your `.env` file and uncomment/update these lines:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM="Livestream ERP <your-email@gmail.com>"
```

3. **Restart the Backend Server**

After updating `.env`, restart your backend server:

```bash
# Stop the current server (Ctrl+C)
# Then start again
bun run server:dev
```

## Testing the Features

### 1. Test Console Logging

1. Open <http://localhost:5173>
2. Open browser Developer Tools (F12)
3. Go to the Console tab
4. Create a new order
5. You'll see a formatted payment link in the console:

```
============================================================
✅ ORDER CREATED SUCCESSFULLY
============================================================
Order ID: abc-123-def-456
Payment Link: http://localhost:5173/checkout/abc-123-def-456
============================================================
```

### 2. Test Email Sending

**Prerequisites:**

- Email configuration completed in `.env`
- Backend server restarted

**Steps:**

1. Create a new order with a valid email address
2. Check the buyer's email inbox
3. They should receive a beautifully formatted email with:
   - Order details
   - Total amount
   - "Pay Now" button with the payment link

**Email Template Features:**

- Responsive design
- Professional gradient styling
- Clear call-to-action button
- Order information display
- Security notice

### 3. Test the Payment Flow

1. Copy the payment link from console or email
2. Open it in a browser (or different browser/incognito)
3. You'll see:
   - Order summary with all items
   - Subtotal, tax, shipping breakdown
   - Stripe payment form
   - Support for cards, Apple Pay, Google Pay

## Troubleshooting

### Email Not Sending

Check the backend logs for:

```
✅ Email service initialized successfully
✅ Payment link email sent to buyer@email.com
```

If you see:

```
Email configuration is incomplete. Email sending will be disabled.
```

This means environment variables are missing. Double-check your `.env` file.

### Gmail Authentication Errors

Common issues:

- Using regular password instead of App Password
- 2FA not enabled
- App Password not generated correctly

Solution: Follow Gmail's App Password setup carefully.

### Email in Spam Folder

First-time emails may go to spam. Check:

- Spam/Junk folder
- Mark as "Not Spam" to train filters

## Production Setup

For production, use a professional email service:

1. **SendGrid** (recommended)

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM="Your Business Name <noreply@yourdomain.com>"
```

2. **AWS SES**

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-ses-smtp-username
EMAIL_PASS=your-ses-smtp-password
EMAIL_FROM="Your Business Name <noreply@yourdomain.com>"
```

3. **Mailgun**

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-smtp-username
EMAIL_PASS=your-mailgun-smtp-password
EMAIL_FROM="Your Business Name <noreply@yourdomain.com>"
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `EMAIL_HOST` | No | SMTP server hostname | `smtp.gmail.com` |
| `EMAIL_PORT` | No | SMTP port (587 for TLS, 465 for SSL) | `587` |
| `EMAIL_USER` | No | SMTP username | `your-email@gmail.com` |
| `EMAIL_PASS` | No | SMTP password or app password | `your-app-password` |
| `EMAIL_FROM` | No | Sender name and email | `"Store Name <noreply@store.com>"` |

## Support

If emails are not working:

1. Check backend console logs for errors
2. Verify SMTP credentials
3. Test with a different email provider
4. Check spam/junk folders

Remember: **Email is optional**. The payment link is always logged to the console regardless of email configuration.
