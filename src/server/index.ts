import type { Context } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ordersRoute } from "./routes/orders";
import { paymentsRoute } from "./routes/payments";
import { sellersRoute } from "./routes/sellers";
import { webhooksRoute } from "./routes/webhooks";

const app = new Hono().basePath("/api");

// CORS configuration
const allowedOrigins = [
	"http://localhost:5173",
	"http://localhost:3000",
	"https://livey-payment.web.app",
];

app.use(
	"*",
	cors({
		origin: (origin) => {
			// Allow requests with no origin (like mobile apps or curl)
			if (!origin) return null;
			// Check if origin is in allowed list
			return allowedOrigins.includes(origin) ? origin : null;
		},
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.route("/orders", ordersRoute);
app.route("/payments", paymentsRoute);
app.route("/sellers", sellersRoute);
app.route("/webhooks", webhooksRoute);

// Health check
app.get("/health", (c: Context) => c.json({ status: "ok" }));

export type AppType = typeof app;

export default {
	port: Number(process.env.PORT) || 3000,
	fetch: app.fetch,
};
