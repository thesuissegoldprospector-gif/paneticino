'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Product = {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  imageUrl?: string;
  bakerId?: string;
  bakerName?: string;
};

interface CartState {
  cart: Product[];
  isLoading: boolean;
  total: number;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  _rehydrate: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      isLoading: true,
      total: 0,
      
      _rehydrate: () => {
        // This is called by the provider to signal hydration is complete
        set({ isLoading: false });
      },

      addToCart: (product) => {
        set((state) => {
          const existing = state.cart.find((p) => p.id === product.id);
          let newCart: Product[];
          if (existing) {
            newCart = state.cart.map((p) =>
              p.id === product.id ? { ...p, quantity: (p.quantity || 1) + 1 } : p
            );
          } else {
            newCart = [...state.cart, { ...product, quantity: 1 }];
          }
          const newTotal = newCart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
          return { cart: newCart, total: newTotal };
        });
      },

      removeFromCart: (productId) => {
        set((state) => {
          const newCart = state.cart.filter((p) => p.id !== productId);
          const newTotal = newCart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
          return { cart: newCart, total: newTotal };
        });
      },

      updateItemQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }
        set((state) => {
          const newCart = state.cart.map((p) => (p.id === itemId ? { ...p, quantity } : p));
          const newTotal = newCart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
          return { cart: newCart, total: newTotal };
        });
      },

      clearCart: () => {
        set({ cart: [], total: 0 });
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
         if (state) {
            // This will be called after the store is rehydrated
            state._rehydrate();
         }
      }
    }
  )
);
