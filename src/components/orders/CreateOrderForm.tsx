import { useMutation } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { config } from "@/lib/config";

type CreateOrderRequestItem = {
	productId: string;
	productName: string;
	productSku?: string;
	quantity: number;
	unitPrice: number; // cents
};

type CreateOrderRequest = {
	sellerEmail: string;
	buyerEmail: string;
	buyerName?: string;
	buyerPhone?: string;
	items: CreateOrderRequestItem[];
	shippingAmount: number; // cents
	taxAmount: number; // cents
	notes?: string;
};

type CreateOrderResponse = {
	success: boolean;
	order: {
		id: string;
		totalAmount: number;
		status: string;
	};
};

type CartItemRow = {
	rowId: string;
	// Note: productId is NOT stored in the UI state
	// It will be auto-generated as a UUID when the order is submitted
	productName: string;
	productSku: string;
	quantity: string;
	unitPrice: string; // dollars as string for UX
};

export interface CreateOrderFormProps {
	sellerEmail: string;
	onCreatedRedirectUrl?(orderId: string): string;
}

export const CreateOrderForm: React.FC<CreateOrderFormProps> = ({
	sellerEmail,
	onCreatedRedirectUrl,
}) => {
	const [buyerEmail, setBuyerEmail] = useState("");
	const [buyerName, setBuyerName] = useState("");
	const [buyerPhone, setBuyerPhone] = useState("");
	const [notes, setNotes] = useState("");

	const [shippingAmount, setShippingAmount] = useState("0"); // dollars
	const [taxAmount, setTaxAmount] = useState("0"); // dollars

	const [items, setItems] = useState<CartItemRow[]>([
		{
			rowId: uuidv4(),
			// productId is NOT included - will be auto-generated on submit
			productName: "",
			productSku: "",
			quantity: "1",
			unitPrice: "0",
		},
	]);

	const subtotal = useMemo(() => {
		return items.reduce((sum, item) => {
			const quantity = Number(item.quantity) || 0;
			const unitPriceDollars = Number(item.unitPrice) || 0;
			const unitPriceCents = Math.round(unitPriceDollars * 100);
			return sum + quantity * unitPriceCents;
		}, 0);
	}, [items]);

	const shippingCents = useMemo(
		() => Math.round((Number(shippingAmount) || 0) * 100),
		[shippingAmount],
	);
	const taxCents = useMemo(
		() => Math.round((Number(taxAmount) || 0) * 100),
		[taxAmount],
	);

	const totalCents = subtotal + shippingCents + taxCents;

	const createOrderMutation = useMutation<
		CreateOrderResponse,
		Error,
		CreateOrderRequest
	>({
		mutationFn: async (payload: CreateOrderRequest) => {
			const res = await fetch(`${config.apiUrl}/orders`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const errorBody = await res.json().catch(() => ({}));
				throw new Error(errorBody.error || "Failed to create order");
			}

			return res.json();
		},
		onSuccess: (data) => {
			const redirectUrl =
				onCreatedRedirectUrl?.(data.order.id) ||
				`/checkout/${encodeURIComponent(data.order.id)}`;

			const fullPaymentLink = `${window.location.origin}${redirectUrl}`;

			// Log the payment link to console
			console.log("=".repeat(60));
			console.log("✅ ORDER CREATED SUCCESSFULLY");
			console.log("=".repeat(60));
			console.log(`Order ID: ${data.order.id}`);
			console.log(`Payment Link: ${fullPaymentLink}`);
			console.log("=".repeat(60));

			toast.success("Order created", {
				description: `Order #${data.order.id} created successfully. Check console for payment link.`,
			});

			window.location.href = redirectUrl;
		},
		onError: (error) => {
			toast.error("Failed to create order", {
				description: error.message,
			});
		},
	});

	const handleItemChange = (
		rowId: string,
		field: keyof Omit<CartItemRow, "rowId">,
		value: string,
	) => {
		setItems((prev) =>
			prev.map((item) =>
				item.rowId === rowId
					? {
							...item,
							[field]: value,
						}
					: item,
			),
		);
	};

	const handleAddItem = () => {
		setItems((prev) => [
			...prev,
			{
				rowId: uuidv4(),
				// productId is NOT included - will be auto-generated on submit
				productName: "",
				productSku: "",
				quantity: "1",
				unitPrice: "0",
			},
		]);
	};

	const handleRemoveItem = (rowId: string) => {
		setItems((prev) =>
			prev.length <= 1 ? prev : prev.filter((i) => i.rowId !== rowId),
		);
	};

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();

		if (!buyerEmail) {
			toast.error("Buyer email is required");
			return;
		}

		const normalizedItems: CreateOrderRequestItem[] = items
			.filter((i) => i.productName.trim().length > 0)
			.map((i) => {
				const quantity = Number(i.quantity) || 0;
				const unitPriceDollars = Number(i.unitPrice) || 0;
				const unitPriceCents = Math.round(unitPriceDollars * 100);

				// DEMO: Auto-generate a unique UUID for each product
				// In production, this would typically come from a product catalog/database
				return {
					productId: uuidv4(),
					productName: i.productName,
					productSku: i.productSku || undefined,
					quantity,
					unitPrice: unitPriceCents,
				};
			});

		if (normalizedItems.length === 0) {
			toast.error("At least one line item is required");
			return;
		}

		const payload: CreateOrderRequest = {
			sellerEmail,
			buyerEmail,
			buyerName: buyerName || undefined,
			buyerPhone: buyerPhone || undefined,
			items: normalizedItems,
			shippingAmount: shippingCents,
			taxAmount: taxCents,
			notes: notes || undefined,
		};

		createOrderMutation.mutate(payload);
	};

	const isSubmitting = createOrderMutation.isPending;

	return (
		<Card className="w-full max-w-4xl border-border/60 bg-background/60 shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center justify-between gap-2">
					<span>Create Order</span>
					<Badge variant="outline" className="text-xs font-normal">
						All amounts are in USD
					</Badge>
				</CardTitle>
				<CardDescription>
					Create an order for a live-stream buyer before capturing payment. An
					order ID will be generated and used in the checkout flow.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-8">
				<form onSubmit={handleSubmit} className="space-y-8">
					<div className="grid gap-6 md:grid-cols-2">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="buyerEmail">Buyer email</Label>
								<Input
									id="buyerEmail"
									type="email"
									placeholder="viewer@example.com"
									value={buyerEmail}
									onChange={(e) => setBuyerEmail(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="buyerName">Buyer name</Label>
								<Input
									id="buyerName"
									placeholder="Optional display name"
									value={buyerName}
									onChange={(e) => setBuyerName(e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="buyerPhone">Buyer phone</Label>
								<Input
									id="buyerPhone"
									placeholder="+65 8000 0000"
									value={buyerPhone}
									onChange={(e) => setBuyerPhone(e.target.value)}
								/>
							</div>
						</div>

						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="notes">Order notes</Label>
								<Textarea
									id="notes"
									placeholder="Optional internal notes about this order..."
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									rows={4}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="shippingAmount">Shipping (USD)</Label>
									<Input
										id="shippingAmount"
										type="number"
										min={0}
										step="0.01"
										value={shippingAmount}
										onChange={(e) => setShippingAmount(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="taxAmount">Tax (USD)</Label>
									<Input
										id="taxAmount"
										type="number"
										min={0}
										step="0.01"
										value={taxAmount}
										onChange={(e) => setTaxAmount(e.target.value)}
									/>
								</div>
							</div>
						</div>
					</div>

					<Separator />

					<div className="space-y-4">
						<div className="flex items-center justify-between gap-2">
							<div>
								<h3 className="text-sm font-medium">Line items</h3>
								<p className="text-xs text-muted-foreground">
									Each row represents a product being sold in this order.
								</p>
							</div>

							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleAddItem}
							>
								Add item
							</Button>
						</div>

						<div className="rounded-md border bg-card">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[30%]">Name</TableHead>
										<TableHead className="w-[22%]">SKU</TableHead>
										<TableHead className="w-[12%]">Qty</TableHead>
										<TableHead className="w-[16%]">Unit (USD)</TableHead>
										<TableHead className="text-right w-[16%]">Total</TableHead>
										<TableHead className="w-[4%]" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{items.map((item) => {
										const quantity = Number(item.quantity) || 0;
										const unitPrice = Number(item.unitPrice) || 0;
										const rowTotal = quantity * unitPrice;

										return (
											<TableRow key={item.rowId}>
												<TableCell>
													<Input
														value={item.productName}
														onChange={(e) =>
															handleItemChange(
																item.rowId,
																"productName",
																e.target.value,
															)
														}
														placeholder="Product name"
													/>
												</TableCell>
												<TableCell>
													<Input
														value={item.productSku}
														onChange={(e) =>
															handleItemChange(
																item.rowId,
																"productSku",
																e.target.value,
															)
														}
														placeholder="SKU"
													/>
												</TableCell>
												<TableCell>
													<Input
														type="number"
														min={1}
														value={item.quantity}
														onChange={(e) =>
															handleItemChange(
																item.rowId,
																"quantity",
																e.target.value,
															)
														}
													/>
												</TableCell>
												<TableCell>
													<Input
														type="number"
														min={0}
														step="0.01"
														value={item.unitPrice}
														onChange={(e) =>
															handleItemChange(
																item.rowId,
																"unitPrice",
																e.target.value,
															)
														}
													/>
												</TableCell>
												<TableCell className="text-right text-sm tabular-nums">
													${rowTotal.toFixed(2)}
												</TableCell>
												<TableCell className="text-right">
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="text-destructive hover:text-destructive"
														onClick={() => handleRemoveItem(item.rowId)}
														disabled={items.length <= 1}
													>
														✕
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					</div>

					<Separator />

					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="space-y-1 text-sm text-muted-foreground">
							<p>
								Subtotal:{" "}
								<span className="font-medium text-foreground">
									${(subtotal / 100).toFixed(2)}
								</span>
							</p>
							<p>
								Shipping:{" "}
								<span className="font-medium text-foreground">
									${(shippingCents / 100).toFixed(2)}
								</span>
							</p>
							<p>
								Tax:{" "}
								<span className="font-medium text-foreground">
									${(taxCents / 100).toFixed(2)}
								</span>
							</p>
						</div>

						<div className="flex items-center gap-4">
							<div className="text-right">
								<p className="text-xs uppercase tracking-wide text-muted-foreground">
									Total (USD)
								</p>
								<p className="text-2xl font-semibold tabular-nums">
									${(totalCents / 100).toFixed(2)}
								</p>
							</div>

							<Button
								type="submit"
								className="min-w-[160px]"
								disabled={isSubmitting}
							>
								{isSubmitting ? "Creating order…" : "Create order"}
							</Button>
						</div>
					</div>
				</form>
			</CardContent>
		</Card>
	);
};
