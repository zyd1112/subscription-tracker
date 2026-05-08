import { create } from 'zustand';
import { Subscription } from '../domain/subscription';
import * as db from '../storage/db';

interface SubscriptionState {
  subscriptions: Subscription[];
  isLoading: boolean;
  error: string | null;
  fetchSubscriptions: () => Promise<void>;
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  isLoading: false,
  error: null,
  
  fetchSubscriptions: async () => {
    set({ isLoading: true, error: null });
    try {
      const subs = await db.getAllSubscriptions();
      // 默认按创建时间倒序或扣费日排序，这里先按创建时间倒序
      subs.sort((a, b) => b.createdAt - a.createdAt);
      set({ subscriptions: subs, isLoading: false });
    } catch (e) {
      set({ error: '获取订阅失败', isLoading: false });
    }
  },

  addSubscription: async (subData) => {
    try {
      const now = Date.now();
      const newSub: Subscription = {
        ...subData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      await db.saveSubscription(newSub);
      await get().fetchSubscriptions();
    } catch (e) {
      set({ error: '添加订阅失败' });
      throw e;
    }
  },

  updateSubscription: async (id, updates) => {
    try {
      const existing = await db.getSubscription(id);
      if (!existing) throw new Error('Not found');
      const updated: Subscription = {
        ...existing,
        ...updates,
        updatedAt: Date.now(),
      };
      await db.saveSubscription(updated);
      await get().fetchSubscriptions();
    } catch (e) {
      set({ error: '更新订阅失败' });
      throw e;
    }
  },

  deleteSubscription: async (id) => {
    try {
      await db.deleteSubscription(id);
      await get().fetchSubscriptions();
    } catch (e) {
      set({ error: '删除订阅失败' });
      throw e;
    }
  }
}));
