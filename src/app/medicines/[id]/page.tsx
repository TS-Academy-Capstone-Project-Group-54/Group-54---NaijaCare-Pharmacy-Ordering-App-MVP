import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCartWidget } from "./widget";
import { formatNaira, medicineImageFor, safeDate } from "@/lib/utils";
import { db } from "@/db";
import { medicines } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function MedicineDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await db.query.medicines.findFirst({ where: eq(medicines.id, id) });
  if (!m) return notFound();

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="relative h-[340px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        <Image src={medicineImageFor(m.id, m.image)} alt={m.name} fill className="object-cover" />
      </div>
      <div>
        <h1 className="text-3xl font-bold">{m.name}</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">Generic: {m.genericName}</p>
        <p className="mt-4">{m.description}</p>
        <ul className="mt-4 space-y-1 text-sm">
          <li>Manufacturer: {m.manufacturer}</li>
          <li>Dosage: {m.dosage}</li>
          <li>Expiry: {safeDate(m.expiryDate)}</li>
          <li>Prescription: {m.requiresPrescription ? "Required" : "Not required"}</li>
          <li>Availability: {m.quantityInStock > 0 ? `In stock (${m.quantityInStock})` : "Out of stock"}</li>
        </ul>
        <p className="mt-4 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatNaira(Number(m.price))}</p>
        <div className="mt-4">
          <AddToCartWidget medicine={m} />
        </div>
      </div>
    </div>
  );
}
