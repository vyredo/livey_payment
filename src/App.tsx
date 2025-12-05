import React, { useEffect, useState } from "react";
import { CreateOrderForm } from "./components/orders/CreateOrderForm";
import { CheckoutForm } from "./components/payments/CheckoutForm";
import { OrderConfirmationPage } from "./pages/OrderConfirmation";
import { SellerOnboardingPage } from "./pages/SellerOnboarding";

type Route =
	| { page: "home" }
	| { page: "checkout"; orderId: string }
	| { page: "confirmation"; orderId: string }
	| { page: "seller-onboarding" };

function parseRoute(): Route {
	const path = window.location.pathname;

	if (path === "/seller-onboarding") {
		return { page: "seller-onboarding" };
	}

	const checkoutMatch = path.match(/^\/checkout\/(.+)$/);
	if (checkoutMatch) {
		return { page: "checkout", orderId: decodeURIComponent(checkoutMatch[1]) };
	}

	const confirmationMatch = path.match(/^\/orders\/(.+)\/confirmation$/);
	if (confirmationMatch) {
		return {
			page: "confirmation",
			orderId: decodeURIComponent(confirmationMatch[1]),
		};
	}

	return { page: "home" };
}

export default function App() {
	const [route, setRoute] = useState<Route>(parseRoute);

	useEffect(() => {
		const handlePopState = () => setRoute(parseRoute());
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, []);

	// Demo seller email for testing
	const DEMO_SELLER_EMAIL = "vidy.alfredo1@gmail.com";

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<h1 className="text-xl font-semibold text-gray-900">
							<a
								href="/"
								onClick={(e) => {
									e.preventDefault();
									window.history.pushState({}, "", "/");
									setRoute({ page: "home" });
								}}
							>
								Livestream ERP Payments
							</a>
						</h1>
						<a
							href="/seller-onboarding"
							onClick={(e) => {
								e.preventDefault();
								window.history.pushState({}, "", "/seller-onboarding");
								setRoute({ page: "seller-onboarding" });
							}}
							className="text-sm font-medium text-blue-600 hover:text-blue-700"
						>
							Seller Onboarding
						</a>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 py-8">
				{route.page === "home" && (
					<CreateOrderForm
						sellerEmail={DEMO_SELLER_EMAIL}
						onCreatedRedirectUrl={(orderId) =>
							`/checkout/${encodeURIComponent(orderId)}`
						}
					/>
				)}

				{route.page === "checkout" && <CheckoutForm orderId={route.orderId} />}

				{route.page === "confirmation" && (
					<OrderConfirmationPage orderId={route.orderId} />
				)}

				{route.page === "seller-onboarding" && <SellerOnboardingPage />}
			</main>
		</div>
	);
}
