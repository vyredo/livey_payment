import type { Context } from "hono";
import { Hono } from "hono";
import { prisma } from "../lib/prisma";

export const sellersRoute = new Hono();

// GET /api/sellers/:id - Get seller by ID
sellersRoute.get("/:id", async (c: Context) => {
	try {
		const id = c.req.param("id");

		const seller = await prisma.seller.findUnique({
			where: { id },
		});

		if (!seller) {
			return c.json({ error: "Seller not found" }, 404);
		}

		return c.json(seller);
	} catch (error) {
		console.error("Get seller error:", error);
		return c.json({ error: "Failed to fetch seller" }, 500);
	}
});

// GET /api/sellers/by-email/:email - Get seller by email
sellersRoute.get("/by-email/:email", async (c: Context) => {
	try {
		const email = decodeURIComponent(c.req.param("email"));

		const seller = await prisma.seller.findUnique({
			where: { email },
		});

		if (!seller) {
			return c.json({ error: "Seller not found" }, 404);
		}

		return c.json(seller);
	} catch (error) {
		console.error("Get seller by email error:", error);
		return c.json({ error: "Failed to fetch seller" }, 500);
	}
});
