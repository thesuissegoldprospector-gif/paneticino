'use client';

import { create } from 'zustand';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useEffect } from 'react';
import { collection, doc, deleteDoc, setDoc } from 'firebase/firestore';
import React from 'react';

export interface CartItem {
  id: string; 
  name: string;
  price: string;
  quantity: number;
  imageUrl?: string;
  bakerId: string;
  bakerName: string;
}

export type AddItemInput = Omit<CartItem, 'quantity'> & { quantity?: number };

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  total: number;
  setItems: (items: CartItem[]) => void;
  addItem: (item: AddItemInput) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => Promise<void>;
}

const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: true,
  total: 0,
  setItems: (items) => {
    const newTotal = items.reduce((acc, item) => {
      const priceString = String(item.price || '0').replace('€', '').trim();
      const price = parseFloat(priceString);
      return acc + (isNaN(price) ? 0 : price * item.quantity);
    }, 0);
    set({ items, total: newTotal, isLoading: false });
  },
  addItem: (itemToAdd) => {
    const currentItems = get().items;
    const existingItem = currentItems.find((item) => item.id === itemToAdd.id);

    if (existingItem) {
      get().updateItemQuantity(itemToAdd.id, existingItem.quantity + (itemToAdd.quantity || 1));
    } else {
      const newItem = { ...itemToAdd, quantity: itemToAdd.quantity || 1 };
      const newItems = [...currentItems, newItem];
      get().setItems(newItems);
      
      const { user, firestore } = useUser.getState();
      if (user && firestore) {
        const cartItemRef = doc(firestore, 'users', user.uid, 'cart', newItem.id);
        setDoc(cartItemRef, newItem);
      }
    }
  },
  removeItem: (itemId) => {
    const newItems = get().items.filter((item) => item.id !== itemId);
    get().setItems(newItems);

    const { user, firestore } = useUser.getState();
    if (user && firestore) {
      const cartItemRef = doc(firestore, 'users', user.uid, 'cart', itemId);
      deleteDoc(cartItemRef);
    }
  },
  updateItemQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    const newItems = get().items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    );
    get().setItems(newItems);

    const { user, firestore } = useUser.getState();
    if (user && firestore) {
      const cartItemRef = doc(firestore, 'users', user.uid, 'cart', itemId);
      setDoc(cartItemRef, { quantity }, { merge: true });
    }
  },
  clearCart: async () => {
    const { user, firestore } = useUser.getState();
    const items = get().items;
    if (user && firestore) {
      const deletePromises = items.map(item => {
        const cartItemRef = doc(firestore, 'users', user.uid, 'cart', item.id);
        return deleteDoc(cartItemRef);
      });
      await Promise.all(deletePromises);
    }
    get().setItems([]);
  },
}));

export const useCart = () => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { setItems, ...cartState } = useCartStore();

  const cartQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'cart');
  }, [user, firestore]);

  const { data: cartItems, isLoading: isCartLoading } = useCollection<CartItem>(cartQuery);

  useEffect(() => {
    if (!isUserLoading && !isCartLoading) {
      setItems(cartItems || []);
    }
    if (!user && !isUserLoading) {
      setItems([]);
    }
  }, [cartItems, isCartLoading, isUserLoading, setItems, user]);
  
  useEffect(() => {
    useUser.setState({ user, firestore });
  }, [user, firestore]);

  const isLoading = cartState.isLoading || isUserLoading || isCartLoading;

  return { ...cartState, isLoading };
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  useCart();
  return <>{children}</>;
};
