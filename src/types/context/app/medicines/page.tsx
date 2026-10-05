"use client";

import { useEffect, useMemo, useState } from "react";
import { MedicineCard } from "@/components/medicines/medicine-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { Category, Medicine } from "@/types/medicine";

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [medRes, catRes] = await Promise.all([fetch("/api/medicines?limit=100"), fetch("/api/categories")]);
        const med = await medRes.json();
        const cat = await catRes.json();
        if (ignore) return;
        if (!med.success) {
          setError(med.message || "Could not load medicines.");
          return;
        }
        setMedicines(med.data?.items ?? []);
        setCategories((cat.data ?? []).filter((c: Category) => c.isActive));
      } catch {
        if (!ignore) setError("Could not load medicines. Check your connection and try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return medicines.filter((m) => {
      if (inStockOnly && (!m.isAvailable || m.quantityInStock <= 0)) return false;
      if (categoryId && m.categoryId !== categoryId) return false;
      if (!q) return true;
      return [m.name, m.genericName, m.manufacturer].some((v) => v?.toLowerCase().includes(q));
    });
  }, [medicines, search, categoryId, inStockOnly]);

  const field = "rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800";

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold">Medicines</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Search by brand, generic name or manufacturer. Prices are in Naira.
        </p>
      </header>

      <div className="grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-[1fr_14rem_auto] dark:border-slate-800 dark:bg-slate-900">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search medicines"
          aria-label="Search medicines"
          className={field}
        />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Filter by category" className={field}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
          In stock only
        </label>
      </div>

      {loading ? (
        <div className="grid min-h-[30vh] place-items-center">
          <LoadingSpinner label="Loading medicines..." />
        </div>
      ) : error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
          No medicines match your filters. Clear the search or choose another category.
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
            Showing {visible.length} of {medicines.length}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((m) => (
              <MedicineCard key={m.id} medicine={m} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}