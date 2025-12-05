/**
 * Check seller's Stripe Connect status
 *
 * Usage: node check_seller_status.js
 */

const SELLER_ID = "b06e4064-b18a-4579-a431-ed93830c2eef";

async function checkStatus() {
	console.log("🔍 Checking Seller Status\n");
	console.log("Seller ID:", SELLER_ID);
	console.log("Email: vidy.alfredo1@gmail.com\n");

	try {
		const { PrismaClient } = await import("@prisma/client");
		const prisma = new PrismaClient();

		const seller = await prisma.seller.findUnique({
			where: { id: SELLER_ID },
		});

		if (!seller) {
			console.log("❌ Seller not found");
			await prisma.$disconnect();
			return;
		}

		console.log("📊 Current Status:");
		console.log("=".repeat(60));
		console.log(
			`Stripe Account ID:        ${seller.stripeAccountId || "❌ Not created"}`,
		);
		console.log(
			`Onboarding Completed:     ${seller.stripeOnboardingCompleted ? "✅ Yes" : "❌ No"}`,
		);
		console.log(
			`Account Status:           ${getStatusEmoji(seller.stripeAccountStatus)} ${seller.stripeAccountStatus.toUpperCase()}`,
		);
		console.log(
			`Business Name:            ${seller.businessName || "Not set"}`,
		);
		console.log("=".repeat(60));

		// If account exists, get detailed status from Stripe
		if (seller.stripeAccountId) {
			console.log("\n🔄 Fetching live status from Stripe...\n");

			const response = await fetch(
				"http://localhost:5173/api/payments/callback?sellerId=" + SELLER_ID,
			);
			if (response.ok) {
				const data = await response.json();
				console.log("📋 Live Stripe Status:");
				console.log("=".repeat(60));
				console.log(
					`Charges Enabled:          ${data.status.charges_enabled ? "✅ Yes" : "❌ No"}`,
				);
				console.log(
					`Details Submitted:        ${data.status.details_submitted ? "✅ Yes" : "❌ No"}`,
				);
				console.log("=".repeat(60));

				if (!data.status.charges_enabled) {
					console.log("\n⚠️  Seller cannot receive payments yet");
					console.log(
						"   Onboarding may still be incomplete or under review\n",
					);
				} else {
					console.log("\n✅ Seller is ready to receive payments!\n");
				}
			}
		} else {
			console.log("\n💡 Next Steps:");
			console.log("   1. Run: node test_seller_onboarding.js");
			console.log("   2. Complete the Stripe onboarding form");
			console.log("   3. Check status again\n");
		}

		await prisma.$disconnect();
	} catch (error) {
		console.error("❌ Error:", error.message);
	}
}

function getStatusEmoji(status) {
	const emojis = {
		pending: "⏳",
		restricted: "⚠️",
		enabled: "✅",
	};
	return emojis[status] || "❓";
}

checkStatus();
