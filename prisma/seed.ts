import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Starting database seed...");

	// Create a demo seller
	const seller = await prisma.seller.upsert({
		where: { email: "demo@example.com" },
		update: {},
		create: {
			email: "demo@example.com",
			businessName: "Demo Business",
			stripeOnboardingCompleted: false,
			stripeAccountStatus: "pending",
		},
	});

	console.log("✅ Created demo seller:", seller.email);
	console.log("🎉 Seed completed successfully!");
}

main()
	.catch((e) => {
		console.error("❌ Seed failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
