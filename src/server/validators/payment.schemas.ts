import { z } from "zod";

export const onboardSellerSchema = z
	.object({
		sellerId: z.string().uuid(),
		refreshUrl: z.string().url(),
		returnUrl: z.string().url(),
	})
	.strict();

export const createPaymentIntentSchema = z
	.object({
		orderId: z.string().uuid(),
	})
	.strict();

export const loginLinkSchema = z
	.object({
		sellerId: z.string().uuid(),
	})
	.strict();
