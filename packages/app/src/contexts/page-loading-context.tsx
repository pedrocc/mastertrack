import { useLayoutEffect } from "react";

/**
 * ID do elemento de loading global no DOM
 */
const LOADING_OVERLAY_ID = "page-loading-overlay";

/**
 * Set de páginas que estão carregando
 */
const loadingPages = new Set<string>();

/**
 * Atualiza a visibilidade do overlay de loading
 */
function updateOverlayVisibility() {
  const overlay = document.getElementById(LOADING_OVERLAY_ID);
  if (overlay) {
    overlay.style.display = loadingPages.size > 0 ? "flex" : "none";
  }
}

/**
 * Hook para páginas registrarem seu estado de loading
 * Usa manipulação direta do DOM para evitar re-renders do React
 * @param isLoading - Se a página está carregando dados
 * @param id - ID único para esta página
 */
export function usePageLoading(isLoading: boolean, id: string) {
  useLayoutEffect(() => {
    if (isLoading) {
      loadingPages.add(id);
    } else {
      loadingPages.delete(id);
    }
    updateOverlayVisibility();

    return () => {
      loadingPages.delete(id);
      updateOverlayVisibility();
    };
  }, [isLoading, id]);
}

/**
 * Componente de overlay de loading que é renderizado uma vez
 * e controlado via CSS display property
 */
export function PageLoadingOverlay() {
  return (
    <div
      id={LOADING_OVERLAY_ID}
      style={{ display: "none" }}
      className="fixed inset-0 z-50 bg-background flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4">
        <img src="/logo.png" alt="Masterboi" className="w-12 h-12 rounded-lg animate-pulse" />
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    </div>
  );
}
