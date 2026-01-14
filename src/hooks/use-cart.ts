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
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: (productId?: string) => void; // Optional productId
  _rehydrate: () => void;
  total: number;
}

const calculateTotal = (cart: Product[]): number => {
  return cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      isLoading: true,
      total: 0,
      
      _rehydrate: () => {
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
          return { cart: newCart, total: calculateTotal(newCart) };
        });
      },

      removeFromCart: (productId) => {
        set((state) => {
          const newCart = state.cart.filter((p) => p.id !== productId);
          return { cart: newCart, total: calculateTotal(newCart) };
        });
      },

      updateItemQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }
        set((state) => {
          const newCart = state.cart.map((p) => (p.id === itemId ? { ...p, quantity } : p));
          return { cart: newCart, total: calculateTotal(newCart) };
        });
      },

      clearCart: (productId) => {
        if (productId) {
            // Remove a single item by its ID
             set(state => {
                const newCart = state.cart.filter(item => item.id !== productId);
                return { cart: newCart, total: calculateTotal(newCart) };
            });
        } else {
            // Clear the entire cart
            set({ cart: [], total: 0 });
        }
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
         if (state) {
            state._rehydrate();
         }
      }
    }
  )
);

    