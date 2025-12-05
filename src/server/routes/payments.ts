import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";
import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { StripeService } from "../services/stripe.service";
import {
	createPaymentIntentSchema,
	loginLinkSchema,
	onboardSellerSchema,
} from "../validators/payment.schemas";

export const paymentsRoute = new Hono();
const stripeService = new StripeService();

// POST /api/payments/onboard - Start seller onboarding
paymentsRoute.post(
	"/onboard",
	zValidator("json", onboardSellerSchema),
	async (c: Context) => {
		try {
			const { sellerId, refreshUrl, returnUrl } = c.req.valid("json");

			const seller = await prisma.seller.findUnique({
				where: { id: sellerId },
			});

			if (!seller) {
				return c.json({ error: "Seller not found" }, 404);
			}

			const { url, accountId } = await stripeService.createAccountLink({
				accountId: seller.stripeAccountId || undefined,
				refreshUrl,
				returnUrl,
			});

			if (!seller.stripeAccountId) {
				await prisma.seller.update({
					where: { id: sellerId },
					data: { stripeAccountId: accountId },
				});
			}

			return c.json({ success: true, url, accountId });
		} catch (error) {
			console.error("Onboarding error:", error);
			return c.json({ error: "Failed to create onboarding link" }, 500);
		}
	},
);

// GET /api/payments/callback - Handle Stripe redirect
paymentsRoute.get("/callback", async (c: Context) => {
	try {
		const sellerId = c.req.query("sellerId");

		if (!sellerId) {
			return c.json({ error: "Missing sellerId" }, 400);
		}

		const seller = await prisma.seller.findUnique({
			where: { id: sellerId },
		});

		if (!seller || !seller.stripeAccountId) {
			return c.json({ error: "Invalid seller" }, 404);
		}

		const accountStatus = await stripeService.getAccountStatus(
			seller.stripeAccountId,
		);

		await prisma.seller.update({
			where: { id: sellerId },
			data: {
				stripeOnboardingCompleted: accountStatus.details_submitted,
				stripeAccountStatus: accountStatus.charges_enabled
					? "enabled"
					: "restricted",
			},
		});

		return c.json({ success: true, status: accountStatus });
	} catch (error) {
		console.error("Callback error:", error);
		return c.json({ error: "Failed to process callback" }, 500);
	}
});

// POST /api/payments/create-intent - Create payment intent for order
paymentsRoute.post(
	"/create-intent",
	zValidator("json", createPaymentIntentSchema),
	async (c: Context) => {
		try {
			const { orderId } = c.req.valid("json");

			const order = await prisma.order.findUnique({
				where: { id: orderId },
				include: { seller: true },
			});

			if (!order) {
				return c.json({ error: "Order not found" }, 404);
			}

			if (order.paymentStatus === "paid") {
				return c.json({ error: "Order already paid" }, 400);
			}

			const seller = order.seller;

			if (!seller.stripeAccountId || !seller.stripeOnboardingCompleted) {
				return c.json({ error: "Seller payment setup incomplete" }, 400);
			}

			// Platform fee: 2% + $0.30
			const applicationFeeAmount = Math.round(order.totalAmount * 0.02 + 30);

			const paymentIntent = await stripeService.createPaymentIntent({
				amount: order.totalAmount,
				currency: "usd",
				stripeAccountId: seller.stripeAccountId,
				applicationFeeAmount,
				metadata: {
					orderId: order.id,
					sellerId: seller.id,
				},
			});

			await prisma.transaction.create({
				data: {
					sellerId: seller.id,
					orderId: order.id,
					stripePaymentIntentId: paymentIntent.id,
					amountTotal: order.totalAmount,
					applicationFeeAmount,
					sellerTransferAmount: order.totalAmount - applicationFeeAmount,
					currency: "usd",
					buyerEmail: order.buyerEmail,
					status: "pending",
				},
			});

			return c.json({
				success: true,
				clientSecret: paymentIntent.client_secret,
				paymentIntentId: paymentIntent.id,
			});
		} catch (error) {
			console.error("Create intent error:", error);
			return c.json({ error: "Failed to create payment intent" }, 500);
		}
	},
);

// POST /api/payments/portal - Generate Stripe dashboard link
paymentsRoute.post(
	"/portal",
	zValidator("json", loginLinkSchema),
	async (c: Context) => {
		try {
			const { sellerId } = c.req.valid("json");

			const seller = await prisma.seller.findUnique({
				where: { id: sellerId },
			});

			if (!seller || !seller.stripeAccountId) {
				return c.json({ error: "Seller not connected to Stripe" }, 404);
			}

			const url = await stripeService.createLoginLink(seller.stripeAccountId);

			return c.json({ success: true, url });
		} catch (error) {
			console.error("Portal error:", error);
			return c.json({ error: "Failed to create portal link" }, 500);
		}
	},
);
