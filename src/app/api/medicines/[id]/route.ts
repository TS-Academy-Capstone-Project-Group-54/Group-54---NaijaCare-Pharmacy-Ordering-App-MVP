import { db } from "@/db";
import { categories, medicines } from "@/db/schema";
import { fail, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/route-auth";
import { medicineIdSchema, medicineSchema } from "@/lib/validators";
import { and, eq } from "drizzle-orm";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!medicineIdSchema.safeParse(id).success) return fail("Invalid medicine id.", 400);

  const row = await db
    .select({
      id: medicines.id,
      name: medicines.name,
      genericName: medicines.genericName,
      description: medicines.description,
      categoryId: medicines.categoryId,
      categoryName: categories.name,
      price: medicines.price,
      quantityInStock: medicines.quantityInStock,
      dosage: medicines.dosage,
      manufacturer: medicines.manufacturer,
      image: medicines.image,
      expiryDate: medicines.expiryDate,
      requiresPrescription: medicines.requiresPrescription,
      isAvailable: medicines.isAvailable,
      createdAt: medicines.createdAt,
      updatedAt: medicines.updatedAt,
    })
    .from(medicines)
    .leftJoin(categories, eq(medicines.categoryId, categories.id))
    .where(and(eq(medicines.id, id), eq(medicines.isAvailable, true)))
    .limit(1);

  if (!row[0]) return fail("Medicine not found", 404);
  return ok("Medicine loaded", row[0]);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!medicineIdSchema.safeParse(id).success) return fail("Invalid medicine id.", 400);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request body.", 400);
  }

  const parsed = medicineSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid medicine data.", 400);

  if (parsed.data.categoryId) {
    const category = await db.query.categories.findFirst({
      where: and(eq(categories.id, parsed.data.categoryId), eq(categories.isActive, true)),
    });
    if (!category) return fail("Selected category was not found or is inactive.", 400);
  }

  try {
    const [updated] = await db
      .update(medicines)
      .set({ ...parsed.data, price: String(parsed.data.price), updatedAt: new Date(), expiryDate: parsed.data.expiryDate })
      .where(eq(medicines.id, id))
      .returning();

    if (!updated) return fail("Medicine not found", 404);
    return ok("Medicine updated successfully", updated);
  } catch {
    return fail("Unable to update medicine.", 500);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!medicineIdSchema.safeParse(id).success) return fail("Invalid medicine id.", 400);

  try {
    const [updated] = await db
      .update(medicines)
      .set({ isAvailable: false, updatedAt: new Date() })
      .where(eq(medicines.id, id))
      .returning();
    if (!updated) return fail("Medicine not found", 404);
    return ok("Medicine deactivated", updated);
  } catch {
    return fail("Unable to deactivate medicine.", 500);
  }
}
