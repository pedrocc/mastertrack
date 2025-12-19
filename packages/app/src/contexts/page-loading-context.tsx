import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface PageLoadingContextType {
  /**
   * Indica se alguma página está carregando dados
   */
  isPageLoading: boolean;
  /**
   * Registra um loading state. Retorna uma função para desregistrar.
   * Uso: chamar no início do componente e chamar o retorno no cleanup.
   */
  registerLoading: (id: string) => () => void;
  /**
   * Atualiza o estado de loading de um ID específico
   */
  setLoading: (id: string, loading: boolean) => void;
}

const PageLoadingContext = createContext<PageLoadingContextType>({
  isPageLoading: false,
  registerLoading: () => () => {},
  setLoading: () => {},
});

export function PageLoadingProvider({ children }: { children: ReactNode }) {
  // Map de IDs para seus estados de loading
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());

  const registerLoading = useCallback((id: string) => {
    setLoadingStates((prev) => {
      const next = new Map(prev);
      next.set(id, true);
      return next;
    });

    // Retorna função de cleanup
    return () => {
      setLoadingStates((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    };
  }, []);

  const setLoading = useCallback((id: string, loading: boolean) => {
    setLoadingStates((prev) => {
      const current = prev.get(id);
      if (current === loading) return prev;
      const next = new Map(prev);
      next.set(id, loading);
      return next;
    });
  }, []);

  // Calcula se alguma página está carregando
  const isPageLoading = useMemo(() => {
    for (const loading of loadingStates.values()) {
      if (loading) return true;
    }
    return false;
  }, [loadingStates]);

  const value = useMemo(
    () => ({ isPageLoading, registerLoading, setLoading }),
    [isPageLoading, registerLoading, setLoading]
  );

  return <PageLoadingContext.Provider value={value}>{children}</PageLoadingContext.Provider>;
}

/**
 * Hook para o root layout observar o estado de loading das páginas
 */
export function usePageLoadingState() {
  const { isPageLoading } = useContext(PageLoadingContext);
  return isPageLoading;
}

/**
 * Hook para páginas registrarem seu estado de loading
 * @param isLoading - Se a página está carregando dados
 * @param id - ID único para esta página (opcional, usa um ID gerado automaticamente)
 */
export function usePageLoading(isLoading: boolean, id?: string) {
  const { registerLoading, setLoading } = useContext(PageLoadingContext);
  const idRef = useRef(id ?? `page-${Math.random().toString(36).slice(2)}`);

  // Registra no mount, desregistra no unmount
  useEffect(() => {
    const cleanup = registerLoading(idRef.current);
    return cleanup;
  }, [registerLoading]);

  // Atualiza o estado quando isLoading muda
  useEffect(() => {
    setLoading(idRef.current, isLoading);
  }, [isLoading, setLoading]);
}
