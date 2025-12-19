import type { RequestType, SlaConfig } from "@mastertrack/api";
import type { JsonSerialized } from "@mastertrack/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo } from "react";
import { api, handleResponse } from "../lib/api";
import { useAuth } from "./auth-context";

// SLA status for a specific request
export interface SLAStatus {
  daysRemaining: number;
  hoursRemaining: number;
  isOverdue: boolean;
  isWarning: boolean; // Less than 1 day remaining
  isCritical: boolean; // Less than 4 hours remaining
  percentUsed: number;
}

type SlaConfigJson = JsonSerialized<SlaConfig>;

interface SLASettingsContextType {
  slaConfigs: SlaConfigJson[];
  isLoading: boolean;
  getSLAForType: (type: RequestType) => SlaConfigJson | undefined;
  updateSLA: (type: RequestType, slaDays: number) => Promise<void>;
  calculateSLAStatus: (createdAt: string, type: RequestType) => SLAStatus;
}

const SLASettingsContext = createContext<SLASettingsContextType | null>(null);

interface SLASettingsProviderProps {
  children: React.ReactNode;
}

export function SLASettingsProvider({ children }: SLASettingsProviderProps) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data: slaConfigs = [], isLoading } = useQuery({
    queryKey: ["sla-configs"],
    queryFn: async () => {
      const response = await api.api["sla-configs"].$get();
      const result = await handleResponse<{ data: SlaConfigJson[] }>(response);
      return result.data;
    },
    enabled: isAuthenticated, // Only fetch when user is authenticated
  });

  const updateMutation = useMutation({
    mutationFn: async ({ type, slaDays }: { type: RequestType; slaDays: number }) => {
      const response = await api.api["sla-configs"][":type"].$put({
        param: { type },
        json: { slaDays },
      });
      return handleResponse<{ data: SlaConfigJson }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-configs"] });
    },
  });

  const getSLAForType = useCallback(
    (type: RequestType): SlaConfigJson | undefined => {
      return slaConfigs.find((c) => c.type === type);
    },
    [slaConfigs]
  );

  const updateSLA = useCallback(
    async (type: RequestType, slaDays: number) => {
      await updateMutation.mutateAsync({ type, slaDays });
    },
    [updateMutation]
  );

  const calculateSLAStatus = useCallback(
    (createdAt: string, type: RequestType): SLAStatus => {
      const config = getSLAForType(type);
      const slaDays = config?.slaDays ?? 3; // Default to 3 days if not found

      const created = new Date(createdAt);
      const deadline = new Date(created.getTime() + slaDays * 24 * 60 * 60 * 1000);
      const now = new Date();

      const msRemaining = deadline.getTime() - now.getTime();
      const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
      const daysRemaining = Math.floor(hoursRemaining / 24);

      const totalMs = slaDays * 24 * 60 * 60 * 1000;
      const msUsed = now.getTime() - created.getTime();
      const percentUsed = Math.min(100, Math.max(0, (msUsed / totalMs) * 100));

      return {
        daysRemaining: Math.max(0, daysRemaining),
        hoursRemaining: Math.max(0, hoursRemaining),
        isOverdue: msRemaining < 0,
        isWarning: hoursRemaining <= 24 && hoursRemaining > 4,
        isCritical: hoursRemaining <= 4,
        percentUsed,
      };
    },
    [getSLAForType]
  );

  const value = useMemo(
    () => ({
      slaConfigs,
      isLoading,
      getSLAForType,
      updateSLA,
      calculateSLAStatus,
    }),
    [slaConfigs, isLoading, getSLAForType, updateSLA, calculateSLAStatus]
  );

  return <SLASettingsContext.Provider value={value}>{children}</SLASettingsContext.Provider>;
}

export function useSLASettings() {
  const context = useContext(SLASettingsContext);
  if (!context) {
    throw new Error("useSLASettings must be used within a SLASettingsProvider");
  }
  return context;
}
