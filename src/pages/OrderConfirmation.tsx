import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { config } from "@/lib/config";

type OrderItem = {
	id: string;
	productId: string;
	productName: string;
	productSku?: string | null;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
};

type Order = {
	id: string;
	buyerEmail: string;
	buyerName?: string | null;
	buyerPhone?: string | null;
	subtotal: number;
	taxAmount: number;
	shippingAmount: number;
	totalAmount: number;
	status: string;
	paymentStatus: string;
	fulfillmentStatus: string;
	notes?: string | null;
	items: OrderItem[];
};

type GetOrderResponse = {
	success: boolean;
	order: Order;
};

export interface OrderConfirmationPageProps {
	orderId: string;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
	orderId,
}) => {
	const query = useQuery<GetOrderResponse, Error>({
		queryKey: ["order", orderId],
		queryFn: async () => {
			const res = await fetch(
				`${config.apiUrl}/orders/${encodeURIComponent(orderId)}`,
			);

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || "Failed to load order");
			}

			return res.json();
		},
	});

	if (query.isLoading) {
		return (
			<Card className="max-w-3xl shadow-sm">
				<CardHeader>
					<Skeleton className="h-6 w-40" />
					<Skeleton className="mt-2 h-4 w-56" />
				</CardHeader>
				<CardContent className="space-y-3">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-4/5" />
					<Skeleton className="h-4 w-3/5" />
				</CardContent>
			</Card>
		);
	}

	if (query.error) {
		return (
			<Card className="max-w-3xl shadow-sm">
				<CardHeader>
					<CardTitle>Unable to load order</CardTitle>
					<CardDescription>
						There was a problem fetching your order details.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-destructive">
						{(query.error as Error).message}
					</p>
				</CardContent>
			</Card>
		);
	}

	const order = query.data?.order;

	if (!order) {
		return (
			<Card className="max-w-3xl shadow-sm">
				<CardHeader>
					<CardTitle>Order not found</CardTitle>
					<CardDescription>
						This order does not exist or may have been cancelled.
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const isPaid = order.paymentStatus === "paid";
	const isFulfilled = order.fulfillmentStatus === "fulfilled";

	return (
		<Card className="max-w-3xl shadow-sm">
			<CardHeader className="space-y-2">
				<div className="flex items-center justify-between gap-3">
					<div>
						<CardTitle>Order confirmation</CardTitle>
						<CardDescription>
							Thank you for your purchase. A receipt will be emailed to you
							shortly.
						</CardDescription>
					</div>
					<div className="flex flex-col items-end gap-2 text-xs">
						<Badge variant={isPaid ? "default" : "outline"}>
							{isPaid ? "Payment received" : "Awaiting payment"}
						</Badge>
						<Badge variant={isFulfilled ? "default" : "outline"}>
							{isFulfilled ? "Fulfilled" : "Pending fulfillment"}
						</Badge>
					</div>
				</div>
				<p className="text-xs text-muted-foreground">
					Order ID: <span className="font-mono">{order.id}</span>
				</p>
			</CardHeader>

			<CardContent className="space-y-6 text-sm">
				<div className="space-y-1">
					<p className="font-medium text-muted-foreground">Buyer</p>
					<p>{order.buyerEmail}</p>
					<p className="text-muted-foreground">
						{order.buyerName || "No name provided"}
						{order.buyerPhone ? ` • ${order.buyerPhone}` : ""}
					</p>
				</div>

				<Separator />

				<div className="space-y-2">
					<p className="font-medium text-muted-foreground">Items</p>
					<div className="divide-y rounded-md border bg-card">
						{order.items.map((item) => (
							<div
								key={item.id}
								className="flex items-center justify-between gap-3 px-3 py-2"
							>
								<div className="space-y-0.5">
									<p className="font-medium">{item.productName}</p>
									<p className="text-xs text-muted-foreground">
										{item.productSku ? `SKU: ${item.productSku} • ` : null}
										Qty {item.quantity}
									</p>
								</div>
								<p className="text-sm font-medium tabular-nums">
									{(item.totalPrice / 100).toFixed(2)} USD
								</p>
							</div>
						))}
					</div>
				</div>

				<Separator />

				<div className="space-y-1">
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">Subtotal</span>
						<span className="tabular-nums">
							{(order.subtotal / 100).toFixed(2)} USD
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">Shipping</span>
						<span className="tabular-nums">
							{(order.shippingAmount / 100).toFixed(2)} USD
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">Tax</span>
						<span className="tabular-nums">
							{(order.taxAmount / 100).toFixed(2)} USD
						</span>
					</div>
					<Separator className="my-2" />
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">Total</span>
						<span className="text-lg font-semibold tabular-nums">
							{(order.totalAmount / 100).toFixed(2)} USD
						</span>
					</div>
				</div>

				{order.notes ? (
					<>
						<Separator />
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">
								Seller notes
							</p>
							<p className="whitespace-pre-line text-xs text-muted-foreground">
								{order.notes}
							</p>
						</div>
					</>
				) : null}
			</CardContent>
		</Card>
	);
};

export default OrderConfirmationPage;
