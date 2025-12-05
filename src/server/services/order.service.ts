import { prisma } from "../lib/prisma";

export class OrderService {
	async createOrder(data: {
		sellerEmail: string;
		buyerEmail: string;
		buyerName?: string;
		buyerPhone?: string;
		items: Array<{
			productId: string;
			productName: string;
			productSku?: string;
			quantity: number;
			unitPrice: number;
		}>;
		shippingAmount?: number;
		taxAmount?: number;
		notes?: string;
	}) {
		// Find or create seller by email
		let seller = await prisma.seller.findUnique({
			where: { email: data.sellerEmail },
		});

		if (!seller) {
			seller = await prisma.seller.create({
				data: { email: data.sellerEmail },
			});
		}

		const subtotal = data.items.reduce((sum, item) => {
			return sum + item.quantity * item.unitPrice;
		}, 0);

		const shippingAmount = data.shippingAmount ?? 0;
		const taxAmount = data.taxAmount ?? 0;
		const totalAmount = subtotal + shippingAmount + taxAmount;

		const order = await prisma.order.create({
			data: {
				sellerId: seller.id,
				buyerEmail: data.buyerEmail,
				buyerName: data.buyerName,
				buyerPhone: data.buyerPhone,
				subtotal,
				taxAmount,
				shippingAmount,
				totalAmount,
				notes: data.notes,
				items: {
					create: data.items.map((item) => ({
						productId: item.productId,
						productName: item.productName,
						productSku: item.productSku,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						totalPrice: item.quantity * item.unitPrice,
					})),
				},
			},
			include: {
				items: true,
				seller: {
					select: {
						stripeAccountId: true,
						stripeOnboardingCompleted: true,
						stripeAccountStatus: true,
					},
				},
				transactions: true,
			},
		});

		return order;
	}

	async getOrder(orderId: string) {
		return prisma.order.findUnique({
			where: { id: orderId },
			include: {
				items: true,
				seller: true,
				transactions: true,
			},
		});
	}

	async updateOrderStatus(params: {
		orderId: string;
		status?: string;
		paymentStatus?: string;
		fulfillmentStatus?: string;
	}) {
		const { orderId, status, paymentStatus, fulfillmentStatus } = params;

		return prisma.order.update({
			where: { id: orderId },
			data: {
				...(status ? { status } : {}),
				...(paymentStatus ? { paymentStatus } : {}),
				...(fulfillmentStatus ? { fulfillmentStatus } : {}),
				updatedAt: new Date(),
			},
		});
	}
}
