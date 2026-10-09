"use client";

import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { medicineImageFor } from "@/lib/utils";

type CartMedicine = {
  id: string;
  name: string;
  price: string | number;
  quantityInStock: number;
  image: string;
};

export function AddToCartWidget({ medicine }: { medicine: CartMedicine }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        aria-label={`Quantity of ${medicine.name}`}
        min={1}
        max={medicine.quantityInStock}
        step={1}
        value={qty}
        onChange={(e) => {
          const nextQuantity = Number(e.target.value);
          if (Number.isFinite(nextQuantity)) {
            setQty(Math.min(medicine.quantityInStock, Math.max(1, Math.floor(nextQuantity))));
          }
        }}
        className="w-20 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
      />
      <Button
        onClick={() =>
          addItem({
            medicineId: medicine.id,
            medicineName: medicine.name,
            quantity: qty,
            unitPrice: Number(medicine.price),
            image: medicineImageFor(medicine.id, medicine.image),
            availableStock: medicine.quantityInStock,
          })
        }
        disabled={medicine.quantityInStock < 1 || qty > medicine.quantityInStock}
      >
        Add to cart
      </Button>
    </div>
  );
}
