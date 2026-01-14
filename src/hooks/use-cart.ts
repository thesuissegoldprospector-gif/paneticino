'use client';

import { create } from 'zustand';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useEffect, useMemo } from 'react';
import { collection, doc, deleteDoc, setDoc } from 'firebase/firestore';

// Define the type for a cart item
export interface CartItem {
  id: string; // Corresponds to productId
  name: string;
  price: string;
  quantity: number;
  imageUrl?: string;
  bakerId: string;
  bakerName: string;
}

// Define the state structure for the cart store
interface CartState {
  items: CartItem[];
  isLoading: boolean;
  total: number;
  setItems: (items: CartItem[]) => void;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => Promise<void>;
}

const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: true,
  total: 0,
  setItems: (items) => {
    const total = items.reduce((acc, item) => {
        // remove currency symbol and parse
        const price = parseFloat(item.price.replace(new RegExp('[^0-9.-]+', 'g'), ''));
        return acc + price * item.quantity;
    }, 0);
    set({ items, total, isLoading: false });
  },
  addItem: (itemToAdd) => {
    const items = get().items;
    const existingItem = items.find((item) => item.id === itemToAdd.id);

    if (existingItem) {
      get().updateItemQuantity(itemToAdd.id, existingItem.quantity + (itemToAdd.quantity || 1));
    } else {
      const newItem = { ...itemToAdd, quantity: itemToAdd.quantity || 1 };
      const newItems = [...items, newItem];
      get().setItems(newItems);
      // Also update in Firestore
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
    // Also remove from Firestore
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
    // Also update in Firestore
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
      // Create a batch write to delete all items
      const deletePromises = items.map(item => {
        const cartItemRef = doc(firestore, 'users', user.uid, 'cart', item.id);
        return deleteDoc(cartItemRef);
      });
      await Promise.all(deletePromises);
    }
    get().setItems([]);
  },
}));

// A wrapper hook to sync Firestore with the Zustand store
export const useCart = () => {
  const { user } = useUser();
  const firestore = useFirestore();
  const { setItems, ...cartState } = useCartStore();

  const cartQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'cart');
  }, [user, firestore]);

  const { data: cartItems, isLoading } = useCollection<CartItem>(cartQuery);

  useEffect(() => {
    if (!isLoading && cartItems) {
      setItems(cartItems);
    } else if (!user) {
      // Clear cart on logout
      setItems([]);
    }
  }, [cartItems, isLoading, setItems, user]);
  
  // Pass user and firestore to the store for actions
  useEffect(() => {
    useUser.setState({ user, firestore });
  }, [user, firestore]);

  return { ...cartState, items: cartState.items, isLoading: cartState.isLoading };
};

// Provider component to initialize the hook
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  useCart(); // Initialize the hook
  return <>{children}</>;
};
