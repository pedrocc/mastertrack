import { RouterProvider, createRouter } from "@tanstack/react-router";
import { Providers } from "./components/providers";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
