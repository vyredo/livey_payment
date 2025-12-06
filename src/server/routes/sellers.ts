import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";
import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export const sellersRoute = new Hono();

const createSellerSchema = z.object({
	email: z.string().email(),
	businessName: z.string().optional(),
});

// POST /api/sellers - Create or get seller by email
sellersRoute.post("/", zValidator("json", createSellerSchema), async (c) => {
	try {
		const { email, businessName } = c.req.valid("json");

		// Find or create seller
		let seller = await prisma.seller.findUnique({
			where: { email },
		});

		if (!seller) {
			seller = await prisma.seller.create({
				data: {
					email,
					businessName: businessName || null,
				},
			});
		}

		return c.json(seller, seller ? 200 : 201);
	} catch (error) {
		console.error("Create seller error:", error);
		return c.json({ error: "Failed to create seller" }, 500);
	}
});

// GET /api/sellers/by-email/:email - Get seller by email (must be before /:id)
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
