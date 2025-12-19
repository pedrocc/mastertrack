import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * Store simples para gerenciar o estado de loading das páginas
 * Usa o padrão de external store para evitar loops de re-render
 */
function createPageLoadingStore() {
  const loadingStates = new Map<string, boolean>();
  const listeners = new Set<() => void>();

  function getSnapshot(): boolean {
    for (const loading of loadingStates.values()) {
      if (loading) return true;
    }
    return false;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function notify() {
    for (const listener of listeners) {
      listener();
    }
  }

  function setLoading(id: string, loading: boolean) {
    const current = loadingStates.get(id);
    if (current === loading) return;

    loadingStates.set(id, loading);
    notify();
  }

  function unregister(id: string) {
    if (loadingStates.has(id)) {
      loadingStates.delete(id);
      notify();
    }
  }

  return { getSnapshot, subscribe, setLoading, unregister };
}

type PageLoadingStore = ReturnType<typeof createPageLoadingStore>;

const PageLoadingContext = createContext<PageLoadingStore | null>(null);

export function PageLoadingProvider({ children }: { children: ReactNode }) {
  // Cria o store uma única vez
  const storeRef = useRef<PageLoadingStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createPageLoadingStore();
  }

  return (
    <PageLoadingContext.Provider value={storeRef.current}>{children}</PageLoadingContext.Provider>
  );
}

/**
 * Hook para o root layout observar o estado de loading das páginas
 */
export function usePageLoadingState(): boolean {
  const store = useContext(PageLoadingContext);

  if (!store) {
    throw new Error("usePageLoadingState must be used within PageLoadingProvider");
  }

  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/**
 * Hook para páginas registrarem seu estado de loading
 * @param isLoading - Se a página está carregando dados
 * @param id - ID único para esta página
 */
export function usePageLoading(isLoading: boolean, id: string) {
  const store = useContext(PageLoadingContext);
  const prevLoadingRef = useRef<boolean | null>(null);

  // Atualiza o estado apenas quando realmente muda
  useEffect(() => {
    if (!store) return;

    // Só atualiza se o valor realmente mudou
    if (prevLoadingRef.current !== isLoading) {
      prevLoadingRef.current = isLoading;
      store.setLoading(id, isLoading);
    }

    // Cleanup: remove o registro quando o componente desmonta
    return () => {
      store.unregister(id);
    };
  }, [store, id, isLoading]);
}
