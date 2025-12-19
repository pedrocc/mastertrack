import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

const baseUrl = import.meta.env["VITE_API_URL"] || "";

export interface RoutePoint {
  location: string;
  lat: number;
  lng: number;
  date: string;
  status: "completed" | "current" | "pending";
}

export interface Container {
  id: string;
  companyId: string;
  number: string;
  isFrozen: boolean;
  status: "a_embarcar" | "embarcado" | "em_transito" | "entregue";
  paymentStatus: "ok" | "pendente";
  origin: string;
  destination: string;
  departureDate: string;
  arrivalForecast: string;
  progress: number;
  route: RoutePoint[];
  cargo: string;
  weight: string;
  createdAt: string;
  updatedAt: string;
}

interface ContainerFromAPI {
  id: string;
  companyId: string;
  number: string;
  isFrozen: boolean;
  status: string;
  paymentStatus: string;
  origin: string;
  destination: string;
  departureDate: string;
  arrivalForecast: string;
  progress: number;
  route: string; // JSON string from API
  cargo: string;
  weight: string;
  createdAt: string;
  updatedAt: string;
}

interface ContainersResponse {
  data: ContainerFromAPI[];
}

// Get auth token
async function getAuthToken(): Promise<string | null> {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Parse container from API format
function parseContainer(container: ContainerFromAPI): Container {
  let route: RoutePoint[] = [];
  try {
    route = JSON.parse(container.route) as RoutePoint[];
  } catch {
    route = [];
  }

  return {
    ...container,
    status: container.status as Container["status"],
    paymentStatus: container.paymentStatus as Container["paymentStatus"],
    route,
  };
}

/**
 * Hook to fetch containers for a specific company
 */
export function useCompanyContainers(companyId: string | undefined) {
  return useQuery({
    queryKey: ["containers", "company", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const token = await getAuthToken();
      const response = await fetch(`${baseUrl}/api/containers/company/${companyId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = (await response.json()) as ContainersResponse;
      return result.data.map(parseContainer);
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch all containers (admin)
 */
export function useAllContainers(page = 1, pageSize = 100) {
  return useQuery({
    queryKey: ["containers", "all", page, pageSize],
    queryFn: async () => {
      const token = await getAuthToken();
      const response = await fetch(`${baseUrl}/api/containers?page=${page}&pageSize=${pageSize}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = (await response.json()) as {
        data: ContainerFromAPI[];
        pagination: {
          page: number;
          pageSize: number;
          total: number;
          totalPages: number;
        };
      };

      return {
        data: result.data.map(parseContainer),
        pagination: result.pagination,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
