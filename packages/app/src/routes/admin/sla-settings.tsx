import type { RequestType } from "@mastertrack/api";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { useSLASettings } from "../../contexts/sla-settings-context";

export const Route = createFileRoute("/admin/sla-settings")({
  component: SLASettingsPage,
});

// Group configurations by category
const CATEGORY_ORDER = [
  {
    name: "Pre-Embarque",
    types: ["pre_proforma", "dados_importador", "schedule_proforma"] as RequestType[],
  },
  {
    name: "Documentos",
    types: ["fichas_tecnicas", "drafts", "schedule_booking"] as RequestType[],
  },
  {
    name: "Alteracoes",
    types: ["alteracao_documento", "alteracao_bl"] as RequestType[],
  },
  {
    name: "Liberacao",
    types: ["telex_release"] as RequestType[],
  },
  {
    name: "Outros",
    types: ["documento", "embarque", "financeiro"] as RequestType[],
  },
];

function SLASettingsPage() {
  const { slaConfigs, isLoading, updateSLA } = useSLASettings();
  const [editingType, setEditingType] = useState<RequestType | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (type: RequestType, currentDays: number) => {
    setEditingType(type);
    setEditValue(String(currentDays));
  };

  const handleSave = async (type: RequestType) => {
    const days = Number.parseInt(editValue, 10);
    if (days > 0 && days <= 30) {
      setIsSaving(true);
      try {
        await updateSLA(type, days);
      } finally {
        setIsSaving(false);
      }
    }
    setEditingType(null);
    setEditValue("");
  };

  const handleCancel = () => {
    setEditingType(null);
    setEditValue("");
  };

  const getConfigForType = (type: RequestType) => {
    return slaConfigs.find((c) => c.type === type);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando configuracoes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuracao de SLA</h1>
        <p className="text-muted-foreground mt-1">
          Defina o prazo maximo (em dias) para cada tipo de requisicao
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <div>
              <p className="text-sm text-blue-800 font-medium">Como funciona o SLA</p>
              <p className="text-sm text-blue-700 mt-1">
                O SLA (Service Level Agreement) define o prazo maximo para atendimento de cada tipo
                de requisicao. No quadro Kanban, as requisicoes mostram o tempo restante e ficam
                destacadas em amarelo (menos de 1 dia) ou vermelho (atrasadas).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SLA Configuration Cards by Category */}
      <div className="space-y-6">
        {CATEGORY_ORDER.map((category) => (
          <Card key={category.name}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <CardDescription>
                Configure o SLA para requisicoes de {category.name.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.types.map((type) => {
                  const config = getConfigForType(type);
                  if (!config) return null;

                  const isEditing = editingType === type;

                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Input
                              type="number"
                              min={1}
                              max={30}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-20 h-8 text-center"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave(type);
                                if (e.key === "Escape") handleCancel();
                              }}
                            />
                            <span className="text-sm text-muted-foreground">dias</span>
                            <Button size="sm" variant="ghost" onClick={handleCancel}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                              </svg>
                            </Button>
                            <Button size="sm" onClick={() => handleSave(type)} disabled={isSaving}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1 bg-background px-3 py-1.5 rounded-md border">
                              <span className="text-lg font-semibold">{config.slaDays}</span>
                              <span className="text-sm text-muted-foreground">
                                {config.slaDays === 1 ? "dia" : "dias"}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(type, config.slaDays)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
