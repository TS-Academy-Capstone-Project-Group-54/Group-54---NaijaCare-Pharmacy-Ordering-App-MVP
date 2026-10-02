import { db } from "@/db";
import { categories, medicines } from "@/db/schema";
import { and, asc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";
import { MedicineCard } from "@/components/ui/medicine-card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function MedicinesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await ensureSeeded();
  const params = await searchParams;

  const filters = [eq(medicines.isAvailable, true)] as any[];
  if (params.search?.trim()) {
    filters.push(or(ilike(medicines.name, `%${params.search.trim()}%`), ilike(medicines.genericName, `%${params.search.trim()}%`)));
  }
  if (params.category) filters.push(eq(medicines.categoryId, params.category));
  if (params.availability === "in-stock") filters.push(gte(medicines.quantityInStock, 1));
  if (params.availability === "out-of-stock") filters.push(eq(medicines.quantityInStock, 0));
  if (params.minPrice) filters.push(gte(medicines.price, params.minPrice));
  if (params.maxPrice) filters.push(lte(medicines.price, params.maxPrice));

  const rows = await db.select().from(medicines).where(and(...filters)).orderBy(asc(medicines.name)).limit(36);
  const cats = await db.select().from(categories).where(eq(categories.isActive, true));

  return (
    <div>
      <h1 className="text-3xl font-bold">Medicine Catalogue</h1>
      <form className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-5 dark:border-slate-800 dark:bg-slate-900">
        <input name="search" defaultValue={params.search} placeholder="Search by name or generic name" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
        <select name="category" defaultValue={params.category ?? ""} className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="availability" defaultValue={params.availability ?? ""} className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          <option value="">All availability</option>
          <option value="in-stock">In stock</option>
          <option value="out-of-stock">Out of stock</option>
        </select>
        <input name="minPrice" type="number" min="0" placeholder="Min ₦" defaultValue={params.minPrice} className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
        <input name="maxPrice" type="number" min="0" placeholder="Max ₦" defaultValue={params.maxPrice} className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
        <button className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 md:col-span-5">Apply Filters</button>
      </form>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.length ? rows.map((m) => <MedicineCard key={m.id} medicine={m} />) : <EmptyState title="No medicines found." subtitle="Try another search or filter." />}
      </div>
    </div>
  );
}
