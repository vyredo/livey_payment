/**
 * Test script for seller Stripe Connect onboarding
 *
 * Usage: node test_seller_onboarding.js
 */

const SELLER_ID = "b06e4064-b18a-4579-a431-ed93830c2eef";
const BASE_URL = "http://localhost:5173";

async function testOnboarding() {
	console.log("🚀 Starting Seller Onboarding Process\n");
	console.log("Seller ID:", SELLER_ID);
	console.log("Email: vidy.alfredo1@gmail.com\n");

	try {
		// Step 1: Create onboarding link
		console.log("📝 Step 1: Creating onboarding link...");
		const response = await fetch(`${BASE_URL}/api/payments/onboard`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				sellerId: SELLER_ID,
				refreshUrl: `${BASE_URL}/onboarding-refresh?sellerId=${SELLER_ID}`,
				returnUrl: `${BASE_URL}/api/payments/callback?sellerId=${SELLER_ID}`,
			}),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${await response.text()}`);
		}

		const data = await response.json();

		console.log("✅ Onboarding link created successfully!\n");
		console.log("📋 Details:");
		console.log("   Stripe Account ID:", data.accountId);
		console.log("   Onboarding URL:", data.url);
		console.log("\n" + "=".repeat(80));
		console.log("🔗 NEXT STEPS FOR THE SELLER:");
		console.log("=".repeat(80));
		console.log("\n1. Open this URL in your browser:");
		console.log(`   ${data.url}`);
		console.log("\n2. Complete the Stripe onboarding form with:");
		console.log("   • Business details");
		console.log("   • Personal information (name, DOB, SSN)");
		console.log("   • Bank account for payouts");
		console.log("   • Identity verification documents");
		console.log("\n3. After completion, you will be redirected automatically");
		console.log("\n4. Check status with: node check_seller_status.js");
		console.log("=".repeat(80) + "\n");
	} catch (error) {
		console.error("❌ Error:", error.message);
		console.log("\n💡 Make sure your development server is running:");
		console.log("   npm run dev");
	}
}

testOnboarding();
