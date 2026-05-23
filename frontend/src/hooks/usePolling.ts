import { useEffect, useRef } from 'react'

interface Options {
  intervalMs: number
  /** Si false, el hook no programa el setInterval (útil para suspender). */
  enabled?: boolean
  /** Refresca inmediatamente cuando la pestaña vuelve al foco. Default: true. */
  refreshOnFocus?: boolean
}

/**
 * Ejecuta `fetcher` cada `intervalMs` ms. Pausa cuando el documento está oculto
 * y re-dispara al volver al foco. La identidad de `fetcher` puede cambiar entre
 * renders — internamente se referencia siempre la versión más reciente.
 */
export function usePolling(fetcher: () => void | Promise<void>, options: Options) {
  const { intervalMs, enabled = true, refreshOnFocus = true } = options
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    const tick = () => { if (!cancelled && !document.hidden) void fetcherRef.current() }

    const id = window.setInterval(tick, intervalMs)

    const onVisibility = () => {
      if (!document.hidden && refreshOnFocus) tick()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intervalMs, enabled, refreshOnFocus])
}
