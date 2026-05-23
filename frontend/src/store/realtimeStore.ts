import { create } from 'zustand'

interface RealtimeStore {
  /** Se incrementa cada vez que llega una notificación nueva al usuario.
   *  Páginas que muestran estado mutable (pedidos, facturas) lo usan como
   *  dependencia para refrescar de inmediato sin esperar a su propio poll. */
  notificationTick: number
  bumpNotificationTick: () => void
}

export const useRealtimeStore = create<RealtimeStore>((set) => ({
  notificationTick: 0,
  bumpNotificationTick: () => set((s) => ({ notificationTick: s.notificationTick + 1 })),
}))
