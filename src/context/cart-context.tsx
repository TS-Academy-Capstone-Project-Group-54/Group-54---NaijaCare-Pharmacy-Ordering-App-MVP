"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { useAuth } from "@/context/auth-context";
import type { CartItem } from "@/types";

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (medicineId: string, quantity: number) => void;
  removeItem: (medicineId: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  storageError: string;
};

type CartSnapshot = {
  raw: string | null;
  error: string;
};

const CartContext = createContext<CartContextType | null>(null);
const EMPTY_SNAPSHOT = JSON.stringify({ raw: null, error: "" } satisfies CartSnapshot);
const listeners = new Map<string, Set<() => void>>();
const storageErrors = new Map<string, string>();
const memoryCarts = new Map<string, CartItem[]>();

function getCartKey(userId?: string) {
  return userId ? `group54-cart-${userId}` : "group54-cart-guest";
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.medicineId === "string" &&
    item.medicineId.length > 0 &&
    typeof item.medicineName === "string" &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    typeof item.unitPrice === "number" &&
    Number.isFinite(item.unitPrice) &&
    item.unitPrice >= 0 &&
    typeof item.image === "string" &&
    typeof item.availableStock === "number" &&
    Number.isInteger(item.availableStock) &&
    item.availableStock >= 0
  );
}

function subscribeToCart(key: string, listener: () => void) {
  let keyListeners = listeners.get(key);
  if (!keyListeners) {
    keyListeners = new Set();
    listeners.set(key, keyListeners);
  }
  keyListeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("storage", onStorage);
    keyListeners?.delete(listener);
    if (keyListeners?.size === 0) listeners.delete(key);
  };
}

function notifyCartChanged(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function getCartSnapshot(key: string): string {
  const memoryCart = memoryCarts.get(key);
  try {
    const snapshot: CartSnapshot = {
      raw: memoryCart ? JSON.stringify(memoryCart) : localStorage.getItem(key),
      error: storageErrors.get(key) ?? "",
    };
    return JSON.stringify(snapshot);
  } catch {
    return JSON.stringify({
      raw: memoryCart ? JSON.stringify(memoryCart) : null,
      error: "Cart storage is unavailable in this browser.",
    } satisfies CartSnapshot);
  }
}

function parseCartSnapshot(snapshot: string) {
  const parsedSnapshot = JSON.parse(snapshot) as CartSnapshot;
  if (!parsedSnapshot.raw) return { items: [] as CartItem[], storageError: parsedSnapshot.error };

  try {
    const parsedItems: unknown = JSON.parse(parsedSnapshot.raw);
    if (!Array.isArray(parsedItems)) throw new Error("Saved cart is not a list.");
    const validItems = parsedItems.filter(isCartItem);
    const seenMedicineIds = new Set<string>();
    const items = validItems.filter((item) => {
      if (seenMedicineIds.has(item.medicineId)) return false;
      seenMedicineIds.add(item.medicineId);
      return true;
    });
    const storageError =
      parsedSnapshot.error ||
      (items.length === parsedItems.length ? "" : "Some invalid or duplicate saved cart items were ignored.");
    return { items, storageError };
  } catch {
    return {
      items: [] as CartItem[],
      storageError: parsedSnapshot.error || "Saved cart data could not be read.",
    };
  }
}

function writeCart(key: string, items: CartItem[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
    memoryCarts.delete(key);
    storageErrors.delete(key);
  } catch {
    memoryCarts.set(key, items);
    storageErrors.set(key, "Your cart could not be saved. It will be available until this page is reloaded.");
  }
  notifyCartChanged(key);
}

function updateCart(key: string, update: (items: CartItem[]) => CartItem[]) {
  const { items } = parseCartSnapshot(getCartSnapshot(key));
  writeCart(key, update(items));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const activeKey = getCartKey(user?.userId);
  const subscribe = useCallback(
    (listener: () => void) => subscribeToCart(activeKey, listener),
    [activeKey],
  );
  const getSnapshot = useCallback(() => getCartSnapshot(activeKey), [activeKey]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SNAPSHOT);
  const { items, storageError } = parseCartSnapshot(snapshot);

  const addItem = useCallback(
    (item: CartItem) => {
      if (!isCartItem(item) || item.availableStock < 1) return;
      updateCart(activeKey, (currentItems) => {
        const existing = currentItems.find((current) => current.medicineId === item.medicineId);
        if (existing) {
          const quantity = Math.min(existing.quantity + item.quantity, item.availableStock);
          return currentItems.map((current) =>
            current.medicineId === item.medicineId ? { ...item, quantity } : current,
          );
        }
        return [...currentItems, { ...item, quantity: Math.min(item.quantity, item.availableStock) }];
      });
    },
    [activeKey],
  );

  const updateQuantity = useCallback(
    (medicineId: string, quantity: number) => {
      if (!Number.isInteger(quantity) || quantity < 1) return;
      updateCart(activeKey, (currentItems) =>
        currentItems.map((item) =>
          item.medicineId === medicineId && item.availableStock > 0
            ? { ...item, quantity: Math.min(quantity, item.availableStock) }
            : item,
        ),
      );
    },
    [activeKey],
  );

  const removeItem = useCallback(
    (medicineId: string) => {
      updateCart(activeKey, (currentItems) => currentItems.filter((item) => item.medicineId !== medicineId));
    },
    [activeKey],
  );

  const clearCart = useCallback(() => writeCart(activeKey, []), [activeKey]);
  const subtotalCents = items.reduce(
    (total, item) => total + Math.round(item.unitPrice * 100) * item.quantity,
    0,
  );
  const subtotal = subtotalCents / 100;
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const value = useMemo(
    () => ({ items, addItem, updateQuantity, removeItem, clearCart, subtotal, itemCount, storageError }),
    [items, addItem, updateQuantity, removeItem, clearCart, subtotal, itemCount, storageError],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
