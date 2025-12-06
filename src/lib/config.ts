/**
 * Frontend configuration
 * All VITE_* environment variables are exposed to the client
 */

export const config = {
	/**
	 * Backend API URL
	 * In development: Uses Vite proxy (http://localhost:3001)
	 * In production: Should point to your deployed backend
	 */
	apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3001",

	/**
	 * Stripe publishable key (client-side)
	 */
	stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
} as const;

// Validate required environment variables
if (!config.stripePublishableKey) {
	console.warn("⚠️ VITE_STRIPE_PUBLISHABLE_KEY is not set");
}

if (!config.apiUrl) {
	console.warn(
		"⚠️ VITE_API_URL is not set, using default: http://localhost:3001",
	);
}
