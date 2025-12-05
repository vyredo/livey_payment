import Stripe from "stripe";

const STRIPE_API_VERSION: Stripe.LatestApiVersion | "2024-11-20.acacia" =
	"2024-11-20.acacia";

export class StripeService {
	private stripe: Stripe;

	constructor() {
		if (!process.env.STRIPE_SECRET_KEY) {
			throw new Error("STRIPE_SECRET_KEY is not set");
		}

		this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
			apiVersion: STRIPE_API_VERSION,
		});
	}

	async createAccountLink(params: {
		accountId?: string;
		refreshUrl: string;
		returnUrl: string;
	}): Promise<{ url: string; accountId: string }> {
		let accountId = params.accountId;

		if (!accountId) {
			const account = await this.stripe.accounts.create({
				type: "express",
				capabilities: {
					card_payments: { requested: true },
					transfers: { requested: true },
				},
			});

			accountId = account.id;
		}

		const accountLink = await this.stripe.accountLinks.create({
			account: accountId,
			refresh_url: params.refreshUrl,
			return_url: params.returnUrl,
			type: "account_onboarding",
		});

		if (!accountLink.url) {
			throw new Error("Stripe did not return an onboarding URL");
		}

		return { url: accountLink.url, accountId };
	}

	async createPaymentIntent(params: {
		amount: number;
		currency: string;
		stripeAccountId: string;
		applicationFeeAmount: number;
		metadata?: Record<string, string>;
	}): Promise<Stripe.PaymentIntent> {
		const metadata = params.metadata ?? {};

		const paymentIntent = await this.stripe.paymentIntents.create(
			{
				amount: params.amount,
				currency: params.currency,
				application_fee_amount: params.applicationFeeAmount,
				transfer_data: {
					destination: params.stripeAccountId,
				},
				metadata,
				automatic_payment_methods: {
					enabled: true,
				},
			},
			{
				idempotencyKey: metadata.orderId
					? `pi_${metadata.orderId}`
					: `pi_${Date.now()}`,
			},
		);

		return paymentIntent;
	}

	async createLoginLink(accountId: string): Promise<string> {
		const loginLink = await this.stripe.accounts.createLoginLink(accountId);

		if (!loginLink.url) {
			throw new Error("Stripe did not return a login link URL");
		}

		return loginLink.url;
	}

	async getAccountStatus(accountId: string): Promise<{
		id: string;
		charges_enabled: boolean;
		details_submitted: boolean;
	}> {
		const account = await this.stripe.accounts.retrieve(accountId);

		return {
			id: account.id,
			charges_enabled: account.charges_enabled ?? false,
			details_submitted: account.details_submitted ?? false,
		};
	}
}
