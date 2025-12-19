import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * Store para gerenciar o estado de loading das páginas
 * Usa useSyncExternalStore para evitar loops de re-render
 */
class PageLoadingStore {
  private loadingStates = new Map<string, boolean>();
  private listeners = new Set<() => void>();
  private snapshot = false;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): boolean => {
    return this.snapshot;
  };

  private updateSnapshot() {
    let newSnapshot = false;
    for (const loading of this.loadingStates.values()) {
      if (loading) {
        newSnapshot = true;
        break;
      }
    }

    if (this.snapshot !== newSnapshot) {
      this.snapshot = newSnapshot;
      // Notify listeners in next microtask to avoid React update loop
      queueMicrotask(() => {
        for (const listener of this.listeners) {
          listener();
        }
      });
    }
  }

  setLoading(id: string, loading: boolean) {
    const current = this.loadingStates.get(id);
    if (current === loading) return;

    this.loadingStates.set(id, loading);
    this.updateSnapshot();
  }

  unregister(id: string) {
    if (this.loadingStates.has(id)) {
      this.loadingStates.delete(id);
      this.updateSnapshot();
    }
  }
}

// Singleton store - created once
const store = new PageLoadingStore();

const PageLoadingContext = createContext(store);

export function PageLoadingProvider({ children }: { children: ReactNode }) {
  return <PageLoadingContext.Provider value={store}>{children}</PageLoadingContext.Provider>;
}

/**
 * Hook para o root layout observar o estado de loading das páginas
 */
export function usePageLoadingState(): boolean {
  const pageStore = useContext(PageLoadingContext);
  return useSyncExternalStore(pageStore.subscribe, pageStore.getSnapshot, pageStore.getSnapshot);
}

/**
 * Hook para páginas registrarem seu estado de loading
 * @param isLoading - Se a página está carregando dados
 * @param id - ID único para esta página
 */
export function usePageLoading(isLoading: boolean, id: string) {
  const pageStore = useContext(PageLoadingContext);
  const lastValueRef = useRef<boolean | undefined>(undefined);

  // Use useLayoutEffect to update synchronously before paint
  useLayoutEffect(() => {
    // Only update if value changed
    if (lastValueRef.current !== isLoading) {
      lastValueRef.current = isLoading;
      pageStore.setLoading(id, isLoading);
    }

    return () => {
      pageStore.unregister(id);
    };
  }, [pageStore, id, isLoading]);
}
