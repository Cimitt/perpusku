'use client'

import { create } from 'zustand'
import type { CartItemWithBuku } from '@/types'

interface CartStore {
  items: CartItemWithBuku[]
  setItems: (items: CartItemWithBuku[]) => void
  addItem: (item: CartItemWithBuku) => void
  removeItem: (id_buku: number) => void
  clear: () => void
  count: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  setItems: (items) => set({ items }),
  addItem: (item) =>
    set((state) => ({
      items: state.items.some((i) => i.id_buku === item.id_buku)
        ? state.items
        : [...state.items, item],
    })),
  removeItem: (id_buku) =>
    set((state) => ({
      items: state.items.filter((i) => i.id_buku !== id_buku),
    })),
  clear: () => set({ items: [] }),
  count: () => get().items.length,
}))
