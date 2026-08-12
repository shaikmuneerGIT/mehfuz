import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine } from "../types";

const STORAGE_KEY = "mehfuz_cart_v1";

interface CartContextValue {
  lines: CartLine[];
  addLine: (line: CartLine) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotalInr: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadInitial(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  function addLine(line: CartLine) {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === line.variantId);
      if (existing) {
        const nextQty = Math.min(existing.quantity + line.quantity, existing.maxStock);
        return prev.map((l) =>
          l.variantId === line.variantId ? { ...l, quantity: nextQty } : l
        );
      }
      return [...prev, line];
    });
  }

  function updateQuantity(variantId: string, quantity: number) {
    setLines((prev) =>
      prev
        .map((l) =>
          l.variantId === variantId
            ? { ...l, quantity: Math.max(1, Math.min(quantity, l.maxStock)) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(variantId: string) {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }

  function clearCart() {
    setLines([]);
  }

  const totalItems = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);
  const subtotalInr = useMemo(
    () => lines.reduce((sum, l) => sum + l.priceInr * l.quantity, 0),
    [lines]
  );

  return (
    <CartContext.Provider
      value={{ lines, addLine, updateQuantity, removeLine, clearCart, totalItems, subtotalInr }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
