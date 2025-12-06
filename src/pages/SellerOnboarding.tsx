import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { StripeConnectCard } from "@/components/payments/StripeConnectCard";
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
import { config } from "@/lib/config";

interface Seller {
	id: string;
	email: string;
	businessName?: string | null;
	stripeAccountId?: string | null;
	stripeOnboardingCompleted: boolean;
	stripeAccountStatus: string;
}

export const SellerOnboardingPage: React.FC = () => {
	const [email, setEmail] = useState("");
	const [seller, setSeller] = useState<Seller | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Check URL params for sellerId on mount
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const sellerId = params.get("sellerId");

		if (sellerId) {
			// Fetch seller by ID
			const fetchSeller = async () => {
				setLoading(true);
				setError(null);

				try {
					const response = await fetch(`${config.apiUrl}/sellers/${sellerId}`);

					if (!response.ok) {
						throw new Error("Seller not found");
					}

					const data = await response.json();
					setSeller(data);
				} catch (err) {
					setError(
						err instanceof Error ? err.message : "Failed to fetch seller",
					);
				} finally {
					setLoading(false);
				}
			};

			fetchSeller();
		}
	}, []);

	const findOrCreateSeller = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email.trim()) {
			setError("Please enter an email address");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// First try to find existing seller
			let response = await fetch(
				`${config.apiUrl}/sellers/by-email/${encodeURIComponent(email)}`,
			);

			if (response.ok) {
				const data = await response.json();
				setSeller(data);
				return;
			}

			// If seller not found, create a new one
			response = await fetch(`${config.apiUrl}/sellers`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			if (!response.ok) {
				throw new Error("Failed to create seller account");
			}

			const data = await response.json();
			setSeller(data);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to process request",
			);
			setSeller(null);
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setSeller(null);
		setEmail("");
		setError(null);
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Seller Onboarding</h1>
				<p className="mt-2 text-gray-600">
					Connect your Stripe account to start receiving payments
				</p>
			</div>

			{!seller ? (
				<Card>
					<CardHeader>
						<CardTitle>Start Selling</CardTitle>
						<CardDescription>
							Enter your email address to access your seller dashboard or create
							a new account
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={findOrCreateSeller} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email Address</Label>
								<Input
									id="email"
									type="email"
									placeholder="seller@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									disabled={loading}
									required
								/>
							</div>

							{error && (
								<div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
									{error}
								</div>
							)}

							<Button type="submit" disabled={loading} className="w-full">
								{loading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Finding account...
									</>
								) : (
									"Continue"
								)}
							</Button>
						</form>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Seller Information</CardTitle>
							<CardDescription>Your account details</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div>
								<p className="text-sm font-medium text-gray-500">Email</p>
								<p className="text-base font-medium text-gray-900">
									{seller.email}
								</p>
							</div>
							{seller.businessName && (
								<div>
									<p className="text-sm font-medium text-gray-500">
										Business Name
									</p>
									<p className="text-base font-medium text-gray-900">
										{seller.businessName}
									</p>
								</div>
							)}
							<div>
								<p className="text-sm font-medium text-gray-500">Seller ID</p>
								<p className="text-xs font-mono text-gray-600">{seller.id}</p>
							</div>
						</CardContent>
					</Card>

					<StripeConnectCard
						seller={seller}
						refreshUrl={`${window.location.origin}/seller-onboarding?sellerId=${seller.id}`}
						returnUrl={`${config.apiUrl}/payments/callback?sellerId=${seller.id}`}
					/>

					<Button variant="outline" onClick={resetForm} className="w-full">
						Switch Account
					</Button>
				</div>
			)}
		</div>
	);
};
