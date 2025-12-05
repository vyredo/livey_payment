import { Hono } from "hono";
import Stripe from "stripe";
import { prisma } from "../lib/prisma";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!webhookSecret) {
	console.warn(
		"STRIPE_WEBHOOK_SECRET is not set. Webhook verification will fail.",
	);
}

if (!stripeSecretKey) {
	console.warn("STRIPE_SECRET_KEY is not set. Stripe client will fail.");
}

const stripe = new Stripe(stripeSecretKey || "", {
	apiVersion: "2024-11-20.acacia",
});

export const webhooksRoute = new Hono();

// POST /api/webhooks/stripe
webhooksRoute.post("/stripe", async (c) => {
	const signature = c.req.header("stripe-signature");
	const body = await c.req.text();

	if (!signature || !webhookSecret) {
		console.error("Missing Stripe signature or webhook secret.");
		return c.json({ error: "Invalid webhook configuration" }, 400);
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
	} catch (err) {
		console.error("Webhook signature verification failed:", err);
		return c.json({ error: "Invalid signature" }, 400);
	}

	try {
		switch (event.type) {
			case "payment_intent.succeeded": {
				const paymentIntent = event.data.object as Stripe.PaymentIntent;
				const orderId = paymentIntent.metadata?.orderId;

				await prisma.transaction.updateMany({
					where: { stripePaymentIntentId: paymentIntent.id },
					data: { status: "succeeded", updatedAt: new Date() },
				});

				if (orderId) {
					await prisma.order.updateMany({
						where: { id: orderId },
						data: {
							status: "paid",
							paymentStatus: "paid",
							updatedAt: new Date(),
						},
					});

					// TODO: Deduct inventory permanently
					// TODO: Trigger fulfillment workflow
					// TODO: Send confirmation email
				}

				break;
			}

			case "payment_intent.payment_failed": {
				const paymentIntent = event.data.object as Stripe.PaymentIntent;

				await prisma.transaction.updateMany({
					where: { stripePaymentIntentId: paymentIntent.id },
					data: { status: "failed", updatedAt: new Date() },
				});

				// TODO: Notify seller of failed payment
				break;
			}

			case "account.updated": {
				const account = event.data.object as Stripe.Account;

				await prisma.seller.updateMany({
					where: { stripeAccountId: account.id },
					data: {
						stripeAccountStatus: account.charges_enabled
							? "enabled"
							: "restricted",
						updatedAt: new Date(),
					},
				});

				break;
			}

			default: {
				// Optionally log unhandled events for debugging
				break;
			}
		}

		return c.json({ received: true });
	} catch (error) {
		console.error("Webhook processing error:", error);
		return c.json({ error: "Webhook processing failed" }, 500);
	}
});
