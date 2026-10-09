import { db } from "@/db";
import { medicines, orderItems, orders } from "@/db/schema";
import { fail, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/route-auth";
import { orderStatusSchema } from "@/lib/validators";
import { and, eq, sql } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request body.", 400);
  }
  const parsed = orderStatusSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid order status", 400);

  try {
    const result = await db.transaction(async (tx) => {
      const existing = await tx.query.orders.findFirst({ where: eq(orders.id, id) });
      if (!existing) return { ok: false as const, error: "Order not found.", status: 404 };
      if (existing.orderStatus === "Cancelled" && parsed.data.orderStatus !== "Cancelled") {
        return { ok: false as const, error: "A cancelled order cannot be reopened.", status: 409 };
      }
      if (existing.orderStatus === "Delivered" && parsed.data.orderStatus !== "Delivered") {
        return { ok: false as const, error: "A delivered order cannot be changed.", status: 409 };
      }

      const [updated] = await tx
        .update(orders)
        .set({ orderStatus: parsed.data.orderStatus, updatedAt: new Date() })
        .where(and(eq(orders.id, id), eq(orders.orderStatus, existing.orderStatus)))
        .returning();

      if (!updated) return { ok: false as const, error: "Order status changed; reload and try again.", status: 409 };

      if (existing.orderStatus !== "Cancelled" && updated.orderStatus === "Cancelled") {
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
        for (const item of items) {
          await tx
            .update(medicines)
            .set({
              quantityInStock: sql`${medicines.quantityInStock} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(medicines.id, item.medicineId));
        }
      }

      return { ok: true as const, order: updated };
    });

    if (!result.ok) return fail(result.error, result.status);
    return ok("Order status updated", result.order);
  } catch {
    return fail("Unable to update order status.", 500);
  }
}
