# CORS Configuration

## Whitelisted Domains

The backend API now allows requests from these origins:

### Development

- `http://localhost:5173` - Vite development server
- `http://localhost:3000` - Alternative local server

### Production

- `https://livey-payment.web.app` - Your production Firebase app

## How It Works

CORS (Cross-Origin Resource Sharing) is configured in [`src/server/index.ts`](src/server/index.ts:11-32):

```typescript
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000", 
  "https://livey-payment.web.app",
];

app.use("*", cors({
  origin: (origin) => {
    if (!origin) return null; // Allow no-origin requests
    return allowedOrigins.includes(origin) ? origin : null;
  },
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: true,
}));
```

## Features

✅ **Secure**: Only whitelisted domains can make API requests  
✅ **Flexible**: Supports both development and production  
✅ **Complete**: Allows all necessary HTTP methods  
✅ **Credentials**: Supports cookies and authentication headers  

## Adding New Domains

To whitelist additional domains, edit [`src/server/index.ts`](src/server/index.ts:12-16):

```typescript
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://livey-payment.web.app",
  "https://your-new-domain.com",  // Add here
];
```

## Testing CORS

### From Your Production App

Test from `https://livey-payment.web.app`:

```javascript
fetch('https://your-backend-api.com/api/health', {
  method: 'GET',
  credentials: 'include'
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error('CORS Error:', err));
```

### Expected Response Headers

When CORS is working correctly, you'll see these headers:

```
Access-Control-Allow-Origin: https://livey-payment.web.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## Deployment Checklist

When deploying your backend:

- [ ] Verify your production backend URL
- [ ] Update Firebase app to point to production API
- [ ] Test CORS from production frontend
- [ ] Check browser console for CORS errors
- [ ] Verify API health endpoint works
- [ ] Test POST requests (create order, payment intent)
- [ ] Ensure credentials are passed correctly

## Environment Variables

Make sure these are set in your production environment:

```bash
# Backend API
PORT=3000
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_URL=file:./prod.db
```

## Common Issues

### CORS Error: "No 'Access-Control-Allow-Origin' header"

**Solution**: Verify your domain is in the `allowedOrigins` array and restart the server.

### CORS Error: "Credentials flag is 'true'"

**Solution**: Ensure both frontend and backend have `credentials: true` set.

### OPTIONS Request Failing

**Solution**: Check that OPTIONS is in `allowMethods` array.

### Wildcard Not Working

**Solution**: We explicitly check origins for security. Add your domain to the whitelist.

## Security Notes

⚠️ **Never use `origin: "*"` in production** - it allows any website to access your API.

✅ **Use explicit whitelisting** - only allow domains you own and trust.

✅ **Enable credentials** - required for authentication cookies/tokens.

✅ **Short maxAge** - 10 minutes (600 seconds) forces browsers to recheck permissions.

## Frontend Configuration

Your frontend at `https://livey-payment.web.app` should make requests like:

```typescript
// Correct - includes credentials
fetch('https://your-backend.com/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ /* data */ })
});

// Incorrect - missing credentials
fetch('https://your-backend.com/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* data */ })
});
```

## Monitoring

Monitor CORS issues in production:

```typescript
// Log CORS errors in frontend
window.addEventListener('error', (e) => {
  if (e.message.includes('CORS')) {
    console.error('CORS Error Detected:', e);
    // Send to your error tracking service
  }
});
```

## Testing Locally with Production Domain

To test your production app locally:

1. Update the API endpoint in your frontend to point to `http://localhost:3000`
2. Add your local IP to the whitelist if testing from another device
3. Use a service like ngrok to expose your local backend

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Add the ngrok URL to allowedOrigins
```
