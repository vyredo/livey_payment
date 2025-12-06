import {
	Elements,
	PaymentElement,
	useElements,
	useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
	| string
	| undefined;

if (!publishableKey) {
	// eslint-disable-next-line no-console
	console.warn(
		"VITE_STRIPE_PUBLISHABLE_KEY is not set. Checkout will not be functional.",
	);
}

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type OrderItem = {
	id: string;
	productId: string;
	productName: string;
	productSku?: string | null;
	quantity: number;
	unitPrice: number; // cents
	totalPrice: number; // cents
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
	items: OrderItem[];
};

type GetOrderResponse = {
	success: boolean;
	order: Order;
};

type CreatePaymentIntentResponse = {
	success: boolean;
	clientSecret: string | null;
	paymentIntentId: string;
};

export interface CheckoutFormProps {
	orderId: string;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ orderId }) => {
	const orderQuery = useQuery<GetOrderResponse, Error>({
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

	const order = orderQuery.data?.order;

	const paymentIntentQuery = useQuery<CreatePaymentIntentResponse, Error>({
		queryKey: ["payment-intent", orderId],
		enabled:
			!!order && order.paymentStatus !== "paid" && Boolean(stripePromise),
		queryFn: async () => {
			const res = await fetch(`${config.apiUrl}/payments/create-intent`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderId }),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || "Failed to create payment intent");
			}

			return res.json();
		},
	});

	const isLoading = orderQuery.isLoading || paymentIntentQuery.isLoading;
	const clientSecret = paymentIntentQuery.data?.clientSecret ?? null;

	const amounts = useMemo(() => {
		if (!order) {
			return null;
		}

		return {
			subtotal: order.subtotal,
			shipping: order.shippingAmount,
			tax: order.taxAmount,
			total: order.totalAmount,
		};
	}, [order]);

	if (orderQuery.isLoading) {
		return (
			<div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
				<Card className="shadow-sm">
					<CardHeader>
						<Skeleton className="h-6 w-40" />
						<Skeleton className="mt-2 h-4 w-64" />
					</CardHeader>
					<CardContent className="space-y-3">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-2/3" />
					</CardContent>
				</Card>
				<Card className="shadow-sm">
					<CardHeader>
						<Skeleton className="h-6 w-32" />
					</CardHeader>
					<CardContent className="space-y-3">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-1/2" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (orderQuery.error) {
		return (
			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle>Checkout error</CardTitle>
					<CardDescription>
						We were unable to load your order. Please refresh the page and try
						again.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-destructive">
						{(orderQuery.error as Error).message}
					</p>
				</CardContent>
			</Card>
		);
	}

	if (!order) {
		return (
			<Card className="shadow-sm">
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

	return (
		<div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start">
			{/* Order summary */}
			<Card className="shadow-sm">
				<CardHeader className="space-y-2">
					<div className="flex items-center justify-between gap-2">
						<div>
							<CardTitle>Order summary</CardTitle>
							<CardDescription>
								Order #{order.id.slice(0, 8)} • {order.buyerEmail}
							</CardDescription>
						</div>
						<Badge
							variant={isPaid ? "default" : "outline"}
							className="text-xs font-normal"
						>
							{isPaid ? "Paid" : "Awaiting payment"}
						</Badge>
					</div>
				</CardHeader>

				<CardContent className="space-y-4">
					<div className="space-y-2 text-sm">
						<p className="font-medium text-muted-foreground">Items</p>
						<div className="divide-y rounded-md border bg-card">
							{order.items.map((item) => (
								<div
									key={item.id}
									className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
								>
									<div className="space-y-0.5">
										<p className="font-medium">{item.productName}</p>
										<p className="text-xs text-muted-foreground">
											{item.productSku ? `SKU: ${item.productSku} • ` : null}
											Qty {item.quantity}
										</p>
									</div>
									<p className="text-sm font-medium tabular-nums">
										${(item.totalPrice / 100).toFixed(2)}
									</p>
								</div>
							))}
						</div>
					</div>

					<Separator />

					{amounts && (
						<div className="space-y-1 text-sm">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Subtotal</span>
								<span className="tabular-nums">
									${(amounts.subtotal / 100).toFixed(2)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Shipping</span>
								<span className="tabular-nums">
									${(amounts.shipping / 100).toFixed(2)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Tax</span>
								<span className="tabular-nums">
									${(amounts.tax / 100).toFixed(2)}
								</span>
							</div>

							<Separator className="my-2" />

							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">Total</span>
								<span className="text-lg font-semibold tabular-nums">
									${(amounts.total / 100).toFixed(2)} USD
								</span>
							</div>
						</div>
					)}

					<Separator />

					<div className="space-y-1 text-xs text-muted-foreground">
						<p>Buyer name: {order.buyerName || "—"}</p>
						<p>Buyer phone: {order.buyerPhone || "—"}</p>
					</div>
				</CardContent>
			</Card>

			{/* Payment column */}
			<Card className="shadow-sm">
				<CardHeader className="space-y-2">
					<CardTitle>
						{isPaid ? "Payment received" : "Complete your payment"}
					</CardTitle>
					<CardDescription>
						{isPaid
							? "This order has already been paid. You can safely close this page."
							: "Securely pay with card, Apple Pay, Google Pay, or Link by Stripe."}
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-4">
					{isPaid ? (
						<div className="rounded-md border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
							Payment for this order was successfully processed. You will
							receive an email receipt from Stripe shortly.
						</div>
					) : null}

					{!isPaid && !publishableKey && (
						<p className="text-sm text-destructive">
							Stripe publishable key is not configured. Payments cannot be
							processed.
						</p>
					)}

					{!isPaid && publishableKey && !clientSecret && isLoading && (
						<div className="space-y-3">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-1/2" />
						</div>
					)}

					{!isPaid && publishableKey && paymentIntentQuery.error && (
						<p className="text-sm text-destructive">
							{(paymentIntentQuery.error as Error).message}
						</p>
					)}

					{!isPaid && publishableKey && clientSecret && stripePromise && (
						<Elements
							stripe={stripePromise}
							options={{
								clientSecret,
								appearance: {
									theme: "stripe",
								},
							}}
						>
							<CheckoutPaymentForm
								orderId={order.id}
								buyerEmail={order.buyerEmail}
							/>
						</Elements>
					)}

					<p className="pt-2 text-center text-[11px] text-muted-foreground">
						Payments are processed securely by Stripe. We never store your full
						card details.
					</p>
				</CardContent>
			</Card>
		</div>
	);
};

interface CheckoutPaymentFormProps {
	orderId: string;
	buyerEmail: string;
}

const CheckoutPaymentForm: React.FC<CheckoutPaymentFormProps> = ({
	orderId,
	buyerEmail,
}) => {
	const stripe = useStripe();
	const elements = useElements();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!stripe || !elements) {
			return;
		}

		setIsSubmitting(true);

		const { error } = await stripe.confirmPayment({
			elements,
			confirmParams: {
				return_url: `${window.location.origin}/orders/${encodeURIComponent(
					orderId,
				)}/confirmation`,
				receipt_email: buyerEmail,
			},
		});

		if (error) {
			toast.error("Payment failed", {
				description: error.message,
			});
			setIsSubmitting(false);
			return;
		}

		toast.success("Redirecting to confirmation…");
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<PaymentElement
				options={{
					layout: "tabs",
				}}
			/>

			<Button
				type="submit"
				className="w-full"
				disabled={!stripe || isSubmitting}
			>
				{isSubmitting ? (
					<span className="inline-flex items-center gap-2">
						<Loader2 className="h-4 w-4 animate-spin" />
						Processing payment…
					</span>
				) : (
					"Pay now"
				)}
			</Button>

			<p className="text-center text-[11px] text-muted-foreground">
				Powered by Stripe
			</p>
		</form>
	);
};
