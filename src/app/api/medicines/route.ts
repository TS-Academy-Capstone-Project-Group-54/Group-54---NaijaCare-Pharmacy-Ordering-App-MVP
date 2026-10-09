import { db } from "@/db";
import { categories, medicines } from "@/db/schema";
import { fail, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/route-auth";
import { ensureSeeded } from "@/lib/seed";
import { medicineIdSchema, medicineListQuerySchema, medicineSchema } from "@/lib/validators";
import { and, asc, count, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsedQuery = medicineListQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsedQuery.success) return fail("Invalid medicine filters or pagination.", 400);

  await ensureSeeded();
  const { search, category, availability, minPrice, maxPrice, page, limit } = parsedQuery.data;
  const filters: SQL[] = [eq(medicines.isAvailable, true)];
  if (search) {
    const searchFilter = or(ilike(medicines.name, `%${search}%`), ilike(medicines.genericName, `%${search}%`));
    if (searchFilter) filters.push(searchFilter);
  }
  if (category) filters.push(eq(medicines.categoryId, category));
  if (availability === "in-stock") filters.push(gte(medicines.quantityInStock, 1));
  if (availability === "out-of-stock") filters.push(eq(medicines.quantityInStock, 0));
  if (minPrice !== undefined) filters.push(gte(medicines.price, String(minPrice)));
  if (maxPrice !== undefined) filters.push(lte(medicines.price, String(maxPrice)));

  const where = and(...filters);
  const offset = (page - 1) * limit;

  const [rows, totalRes] = await Promise.all([
    db
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
      .where(where)
      .orderBy(asc(medicines.name))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(medicines).where(where),
  ]);

  const total = totalRes[0]?.count ?? 0;
  return ok("Medicines loaded", {
    items: rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

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
    const [created] = await db
      .insert(medicines)
      .values({ ...parsed.data, price: String(parsed.data.price), expiryDate: parsed.data.expiryDate })
      .returning();

    return ok("Medicine created successfully", created);
  } catch {
    return fail("Unable to create medicine.", 500);
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return fail("Medicine id is required", 400);
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
