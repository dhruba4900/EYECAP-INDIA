"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItemData } from "@/lib/types";
import { useAuth } from "./AuthContext";

interface CartContextType {
  items: CartItemData[];
  itemCount: number;
  subtotal: number;
  loading: boolean;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  addToCart: (productId: string, variantId?: string | null, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  toastMessage: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshCart = async () => {
    if (!user) {
      setItems([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to load cart", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const addToCart = async (productId: string, variantId?: string | null, quantity: number = 1) => {
    if (!user) {
      showToast("Please log in to add items to your cart");
      return { success: false, error: "Please log in first" };
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId, quantity }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to add to cart");
        return { success: false, error: data.error };
      }

      await refreshCart();
      showToast("Added to bag!");
      setIsDrawerOpen(true);
      return { success: true };
    } catch (e: any) {
      showToast("Error adding to cart");
      return { success: false, error: e.message };
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
      await refreshCart();
    } catch (e) {
      console.error(e);
    }
  };

  const clearCart = async () => {
    try {
      await fetch(`/api/cart?clear=true`, { method: "DELETE" });
      setItems([]);
    } catch (e) {
      console.error(e);
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        loading,
        isDrawerOpen,
        setIsDrawerOpen,
        addToCart,
        removeFromCart,
        clearCart,
        refreshCart,
        toastMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
