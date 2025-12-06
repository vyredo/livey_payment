import { useMutation } from "@tanstack/react-query";
import { ExternalLink, Link as LinkIcon, Loader2 } from "lucide-react";
import React from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { config } from "@/lib/config";

type SellerStripeStatus = "pending" | "restricted" | "enabled" | string;

interface StripeConnectCardProps {
	seller: {
		id: string;
		businessName?: string | null;
		stripeAccountId?: string | null;
		stripeOnboardingCompleted: boolean;
		stripeAccountStatus: SellerStripeStatus;
	};
	/**
	 * URL the seller should be sent back to if they abort onboarding.
	 * Typically the current settings page URL.
	 */
	refreshUrl: string;
	/**
	 * URL the seller should be sent back to after successfully completing onboarding.
	 */
	returnUrl: string;
}

type OnboardResponse = {
	success: boolean;
	url: string;
	accountId: string;
};

type PortalResponse = {
	success: boolean;
	url: string;
};

export const StripeConnectCard: React.FC<StripeConnectCardProps> = ({
	seller,
	refreshUrl,
	returnUrl,
}) => {
	const isConnected =
		!!seller.stripeAccountId &&
		seller.stripeOnboardingCompleted &&
		seller.stripeAccountStatus === "enabled";

	const onboardMutation = useMutation<OnboardResponse, Error>({
		mutationFn: async () => {
			const res = await fetch(`${config.apiUrl}/payments/onboard`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sellerId: seller.id,
					refreshUrl,
					returnUrl,
				}),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || "Failed to start Stripe onboarding");
			}

			return res.json();
		},
		onSuccess: (data) => {
			toast.success("Redirecting to Stripe", {
				description: "Complete onboarding in the Stripe-hosted form.",
			});
			window.location.href = data.url;
		},
		onError: (error) => {
			toast.error("Onboarding failed", {
				description: error.message,
			});
		},
	});

	const portalMutation = useMutation<PortalResponse, Error>({
		mutationFn: async () => {
			const res = await fetch(`${config.apiUrl}/payments/portal`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sellerId: seller.id,
				}),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || "Failed to open Stripe dashboard");
			}

			return res.json();
		},
		onSuccess: (data) => {
			window.open(data.url, "_blank", "noopener,noreferrer");
		},
		onError: (error) => {
			toast.error("Unable to open Stripe dashboard", {
				description: error.message,
			});
		},
	});

	const isLoading = onboardMutation.isPending || portalMutation.isPending;

	if (!seller) {
		return (
			<Card className="border-border/60 bg-background/60 shadow-sm">
				<CardHeader>
					<CardTitle>Payment Settings</CardTitle>
					<CardDescription>Loading Stripe connection status…</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-9 w-44" />
					</div>
				</CardContent>
			</Card>
		);
	}

	const statusLabel = (() => {
		if (!seller.stripeAccountId) return "Not connected";
		if (!seller.stripeOnboardingCompleted) return "Onboarding in progress";
		if (seller.stripeAccountStatus === "enabled") return "Active";
		if (seller.stripeAccountStatus === "restricted") return "Restricted";
		return seller.stripeAccountStatus;
	})();

	const statusVariant: "default" | "outline" | "destructive" | "secondary" =
		!seller.stripeAccountId
			? "outline"
			: seller.stripeAccountStatus === "enabled"
				? "default"
				: seller.stripeAccountStatus === "restricted"
					? "destructive"
					: "secondary";

	return (
		<Card className="border-border/60 bg-background/60 shadow-sm">
			<CardHeader className="flex flex-row items-start justify-between gap-3">
				<div className="space-y-1">
					<CardTitle className="flex items-center gap-2">
						Payment Settings
						<span className="rounded-full bg-[#635BFF]/10 px-2 py-0.5 text-xs font-medium text-[#635BFF]">
							Stripe Connect
						</span>
					</CardTitle>
					<CardDescription>
						Connect your bank account to receive payouts from live stream
						orders.
					</CardDescription>
				</div>

				<Badge variant={statusVariant} className="shrink-0 text-xs font-normal">
					Status: {statusLabel}
				</Badge>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
					<p>
						We use Stripe to securely process payments and route payouts to your
						bank account. You'll be redirected to a Stripe-hosted onboarding
						flow where you can submit your identity and banking details. No
						sensitive information is stored on our servers.
					</p>
				</div>

				<div className="flex flex-wrap gap-3">
					{!isConnected ? (
						<Button
							type="button"
							onClick={() => onboardMutation.mutate()}
							disabled={isLoading}
							className="bg-[#635BFF] text-white hover:bg-[#5347ff]"
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Connecting…
								</>
							) : (
								<>
									<LinkIcon className="mr-2 h-4 w-4" />
									Connect with Stripe
								</>
							)}
						</Button>
					) : (
						<Button
							type="button"
							variant="outline"
							onClick={() => portalMutation.mutate()}
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Opening dashboard…
								</>
							) : (
								<>
									<ExternalLink className="mr-2 h-4 w-4" />
									Open payout dashboard
								</>
							)}
						</Button>
					)}

					<div className="flex flex-col justify-center text-xs text-muted-foreground">
						<p>
							Powered by Stripe. Payouts are automatically scheduled by Stripe.
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
