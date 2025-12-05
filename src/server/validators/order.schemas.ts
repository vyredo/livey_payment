import { z } from "zod";

export const orderItemSchema = z.object({
	productId: z.string().uuid(),
	productName: z.string().min(1),
	productSku: z.string().optional(),
	quantity: z.number().int().positive(),
	unitPrice: z.number().int().positive(), // in cents
});

export const createOrderSchema = z
	.object({
		sellerEmail: z.string().email(),
		buyerEmail: z.string().email(),
		buyerName: z.string().optional(),
		buyerPhone: z.string().optional(),
		items: z.array(orderItemSchema).min(1),
		shippingAmount: z.number().int().nonnegative().default(0),
		taxAmount: z.number().int().nonnegative().default(0),
		notes: z.string().optional(),
	})
	.strict();

export const getOrderSchema = z
	.object({
		orderId: z.string().uuid(),
	})
	.strict();
