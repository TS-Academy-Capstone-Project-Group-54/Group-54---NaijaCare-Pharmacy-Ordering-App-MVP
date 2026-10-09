import { db } from "@/db";
import { medicines, orderItems, orders, users } from "@/db/schema";
import { fail, ok } from "@/lib/api";
import { requireAdmin, requireAuth } from "@/lib/route-auth";
import { checkoutSchema } from "@/lib/validators";
import type { OrderStatus } from "@/types";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";

class InsufficientStockError extends Error {}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();

  const validStatuses: OrderStatus[] = [
    "Pending",
    "Confirmed",
    "Processing",
    "Ready for Delivery",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ];
  if (status && !validStatuses.includes(status as OrderStatus)) {
    return fail("Invalid order status filter.", 400);
  }

  const filters = [];
  if (status) {
    filters.push(eq(orders.orderStatus, status as OrderStatus));
  }
  const where = filters.length > 0 ? and(...filters) : undefined;

  const rows = await db
    .select({
      id: orders.id,
      orderStatus: orders.orderStatus,
      paymentStatus: orders.paymentStatus,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      customerName: users.fullName,
      customerEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.customerId, users.id))
    .where(where)
    .orderBy(desc(orders.createdAt));

  const filtered = search
    ? rows.filter((r) => r.customerName?.toLowerCase().includes(search.toLowerCase()) || r.id.includes(search))
    : rows;

  const statsRows = await db
    .select({
      totalOrders: count(orders.id),
    })
    .from(orders);

  return ok("Orders loaded", {
    items: filtered,
    stats: {
      totalOrders: statsRows[0]?.totalOrders ?? 0,
      pending: rows.filter((r) => r.orderStatus === "Pending").length,
      processing: rows.filter((r) => r.orderStatus === "Processing").length,
      completed: rows.filter((r) => r.orderStatus === "Delivered").length,
    },
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request body.", 400);
  }

  try {
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) return fail("Order could not be placed.", 400);

    const createdOrder = await db.transaction(async (tx) => {
      const prepared = [];

      for (const item of parsed.data.items) {
        const [medicine] = await tx
          .update(medicines)
          .set({
            quantityInStock: sql`${medicines.quantityInStock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(medicines.id, item.medicineId),
              eq(medicines.isAvailable, true),
              gte(medicines.quantityInStock, item.quantity),
            ),
          )
          .returning({
            id: medicines.id,
            name: medicines.name,
            price: medicines.price,
          });

        if (!medicine) throw new InsufficientStockError();

        const unitPriceCents = Math.round(Number(medicine.price) * 100);
        const subtotalCents = unitPriceCents * item.quantity;
        prepared.push({
          orderItem: {
            medicineId: medicine.id,
            medicineName: medicine.name,
            quantity: item.quantity,
            unitPrice: (unitPriceCents / 100).toFixed(2),
            subtotal: (subtotalCents / 100).toFixed(2),
          },
          subtotalCents,
        });
      }

      const totalCents = prepared.reduce((sum, item) => sum + item.subtotalCents, 0);
      const [created] = await tx
        .insert(orders)
        .values({
          customerId: auth.session.userId,
          totalAmount: (totalCents / 100).toFixed(2),
          deliveryAddress: parsed.data.deliveryAddress,
          phoneNumber: parsed.data.phoneNumber,
          paymentStatus: parsed.data.paymentStatus,
          orderStatus: "Pending",
        })
        .returning();

      await tx.insert(orderItems).values(
        prepared.map(({ orderItem }) => ({ orderId: created.id, ...orderItem })),
      );

      return created;
    });

    return ok("Order placed successfully", createdOrder);
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return fail("One or more selected medicines are unavailable or have insufficient stock.", 400);
    }
    return fail("Order could not be placed.", 500);
  }
}
