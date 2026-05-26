import { create } from 'zustand';
import api from '../api/axios';

export interface AppNotification {
  id: string;
  _id?: string;
  type: 'success' | 'warning' | 'info' | 'error';
  urgent?: boolean;
  title: string;
  message: string;
  link?: string;
  time: Date;
  read: boolean;
}

interface NotificationStore {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
  urgentCount: () => number;
  fetchFromServer: () => Promise<void>;
  startPolling: () => () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (n) => {
    const notification: AppNotification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      time: new Date(),
      read: false,
    };
    set((s) => ({ notifications: [notification, ...s.notifications].slice(0, 100) }));
  },

  markRead: async (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    // Also mark on server if it's a backend notification
    const n = get().notifications.find(n => n.id === id);
    if (n?._id) {
      try { await api.patch(`/notifications/${n._id}/read`); } catch {}
    }
  },

  markAllRead: async () => {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
    try { await api.patch('/notifications/read-all/mark'); } catch {}
  },

  clearAll: () => set({ notifications: [] }),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  urgentCount: () => get().notifications.filter((n) => !n.read && n.urgent).length,

  fetchFromServer: async () => {
    try {
      const { data } = await api.get('/notifications');
      const existing = get().notifications;
      const existingIds = new Set(existing.map(n => n._id).filter(Boolean));

      const newNotifs: AppNotification[] = data
        .filter((n: any) => !existingIds.has(n._id))
        .map((n: any) => ({
          id: `server-${n._id}`,
          _id: n._id,
          type: n.type,
          urgent: n.urgent,
          title: n.title,
          message: n.message,
          link: n.link,
          time: new Date(n.createdAt),
          read: n.read,
        }));

      if (newNotifs.length > 0) {
        set((s) => ({
          notifications: [...newNotifs, ...s.notifications].slice(0, 100),
        }));
      }
    } catch {}
  },

  startPolling: () => {
    // Fetch immediately
    get().fetchFromServer();
    // Then every 30 seconds
    const interval = setInterval(() => {
      get().fetchFromServer();
    }, 30000);
    return () => clearInterval(interval);
  },
}));
