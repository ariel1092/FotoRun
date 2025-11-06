"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  id: string
  photoUrl: string
  bibNumber: string
  eventName: string
  price: number
}

interface CartStore {
  items: CartItem[]
  addItems: (items: CartItem[]) => void
  removeItem: (id: string) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItems: (newItems) =>
        set((state) => {
          const existingIds = new Set(state.items.map((item) => item.id))
          const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id))
          return { items: [...state.items, ...uniqueNewItems] }
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      clearCart: () => set({ items: [] }),
      getTotalPrice: () => get().items.reduce((sum, item) => sum + item.price, 0),
      getTotalItems: () => get().items.length,
    }),
    {
      name: "jerpro-cart",
    },
  ),
)
