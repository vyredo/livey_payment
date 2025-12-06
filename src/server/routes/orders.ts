import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { EmailService } from "../services/email.service";
import { OrderService } from "../services/order.service";
import { createOrderSchema, getOrderSchema } from "../validators/order.schemas";

export const ordersRoute = new Hono();
const orderService = new OrderService();
const emailService = new EmailService();

// POST /api/orders - Create new order
ordersRoute.post("/", zValidator("json", createOrderSchema), async (c) => {
	try {
		const data = c.req.valid("json");
		const order = await orderService.createOrder(data);

		// Build the payment link
		// EMAIL_FRONTEND_URL should be the public frontend URL where users access the checkout
		const frontendUrl =
			process.env.EMAIL_FRONTEND_URL || "http://localhost:5173";
		const paymentLink = `${frontendUrl}/checkout/${encodeURIComponent(order.id)}`;

		// Send payment link email to buyer
		try {
			await emailService.sendPaymentLink({
				to: order.buyerEmail,
				buyerName: order.buyerName || undefined,
				orderId: order.id,
				totalAmount: order.totalAmount,
				paymentLink,
			});
		} catch (emailError) {
			console.error("Failed to send payment link email:", emailError);
			// Don't fail the order creation if email fails
		}

		return c.json(
			{
				success: true,
				order: {
					id: order.id,
					totalAmount: order.totalAmount,
					status: order.status,
				},
			},
			201,
		);
	} catch (error) {
		console.error("Error creating order:", error);
		return c.json({ error: "Failed to create order" }, 500);
	}
});

// GET /api/orders/:orderId - Get order details
ordersRoute.get("/:orderId", zValidator("param", getOrderSchema), async (c) => {
	try {
		const { orderId } = c.req.valid("param");
		const order = await orderService.getOrder(orderId);

		if (!order) {
			return c.json({ error: "Order not found" }, 404);
		}

		return c.json({ success: true, order });
	} catch (error) {
		console.error("Error fetching order:", error);
		return c.json({ error: "Failed to fetch order" }, 500);
	}
});
