import type { Company } from "@mastertrack/shared";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { MapRoutePoint } from "../components/ship-tracking-map";

// Container type with company association
export interface CompanyContainer {
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
  route: MapRoutePoint[];
  cargo: string;
  weight: string;
}

interface CompaniesContextType {
  companies: Company[];
  containers: CompanyContainer[];
  addCompany: (company: Omit<Company, "id" | "createdAt">) => void;
  updateCompany: (id: string, company: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  getCompanyContainers: (companyId: string) => CompanyContainer[];
  addContainerToCompany: (
    companyId: string,
    container: Omit<
      CompanyContainer,
      "id" | "companyId" | "status" | "paymentStatus" | "progress" | "route"
    >
  ) => void;
  removeContainerFromCompany: (companyId: string, containerId: string) => void;
  getCompanyById: (id: string) => Company | undefined;
}

const CompaniesContext = createContext<CompaniesContextType | null>(null);

// Initial mock companies
const INITIAL_COMPANIES: Company[] = [
  {
    id: "company-1",
    name: "Importadora Brasil Sul Ltda",
    cnpj: "12.345.678/0001-90",
    email: "contato@brasilsul.com.br",
    phone: "(47) 3333-4444",
    address: "Rua das Palmeiras, 500 - Itajai, SC",
    createdAt: "2024-01-10",
  },
  {
    id: "company-2",
    name: "Global Trading S.A.",
    cnpj: "98.765.432/0001-11",
    email: "comercial@globaltrading.com.br",
    phone: "(11) 5555-6666",
    address: "Av. Paulista, 1000 - Sao Paulo, SP",
    createdAt: "2024-02-15",
  },
  {
    id: "company-3",
    name: "Exporta Mais Comercio Exterior",
    cnpj: "55.666.777/0001-22",
    email: "logistica@exportamais.com.br",
    phone: "(21) 7777-8888",
    address: "Rua do Porto, 250 - Rio de Janeiro, RJ",
    createdAt: "2024-03-20",
  },
];

// Initial mock containers with company associations
const INITIAL_CONTAINERS: CompanyContainer[] = [
  {
    id: "1",
    companyId: "company-1",
    number: "MSCU7234561",
    isFrozen: true,
    status: "em_transito",
    paymentStatus: "ok",
    origin: "Shanghai, China",
    destination: "Santos, Brasil",
    departureDate: "2024-12-01",
    arrivalForecast: "2025-01-15",
    progress: 65,
    cargo: "Produtos Congelados",
    weight: "22.5 ton",
    route: [
      {
        location: "Shanghai, China",
        lat: 31.2304,
        lng: 121.4737,
        date: "01/12/2024",
        status: "completed",
      },
      {
        location: "Singapore",
        lat: 1.3521,
        lng: 103.8198,
        date: "08/12/2024",
        status: "completed",
      },
      {
        location: "Cape Town, Africa do Sul",
        lat: -33.9249,
        lng: 18.4241,
        date: "22/12/2024",
        status: "current",
      },
      {
        location: "Santos, Brasil",
        lat: -23.9608,
        lng: -46.3336,
        date: "15/01/2025",
        status: "pending",
      },
    ],
  },
  {
    id: "2",
    companyId: "company-1",
    number: "MAEU9876543",
    isFrozen: false,
    status: "embarcado",
    paymentStatus: "ok",
    origin: "Rotterdam, Holanda",
    destination: "Paranagua, Brasil",
    departureDate: "2024-12-10",
    arrivalForecast: "2025-01-20",
    progress: 35,
    cargo: "Maquinario Industrial",
    weight: "18.2 ton",
    route: [
      {
        location: "Rotterdam, Holanda",
        lat: 51.9244,
        lng: 4.4777,
        date: "10/12/2024",
        status: "completed",
      },
      {
        location: "Lisboa, Portugal",
        lat: 38.7223,
        lng: -9.1393,
        date: "15/12/2024",
        status: "current",
      },
      {
        location: "Paranagua, Brasil",
        lat: -25.5163,
        lng: -48.5225,
        date: "20/01/2025",
        status: "pending",
      },
    ],
  },
  {
    id: "3",
    companyId: "company-2",
    number: "CMAU4567890",
    isFrozen: true,
    status: "a_embarcar",
    paymentStatus: "pendente",
    origin: "Busan, Coreia do Sul",
    destination: "Rio Grande, Brasil",
    departureDate: "2024-12-20",
    arrivalForecast: "2025-02-05",
    progress: 0,
    cargo: "Frutos do Mar",
    weight: "20.0 ton",
    route: [
      {
        location: "Busan, Coreia do Sul",
        lat: 35.1796,
        lng: 129.0756,
        date: "20/12/2024",
        status: "pending",
      },
      { location: "Hong Kong", lat: 22.3193, lng: 114.1694, date: "25/12/2024", status: "pending" },
      {
        location: "Durban, Africa do Sul",
        lat: -29.8587,
        lng: 31.0218,
        date: "10/01/2025",
        status: "pending",
      },
      {
        location: "Rio Grande, Brasil",
        lat: -32.0353,
        lng: -52.0986,
        date: "05/02/2025",
        status: "pending",
      },
    ],
  },
  {
    id: "4",
    companyId: "company-2",
    number: "OOLU1122334",
    isFrozen: false,
    status: "entregue",
    paymentStatus: "ok",
    origin: "Hamburg, Alemanha",
    destination: "Itajai, Brasil",
    departureDate: "2024-11-01",
    arrivalForecast: "2024-12-10",
    progress: 100,
    cargo: "Pecas Automotivas",
    weight: "15.8 ton",
    route: [
      {
        location: "Hamburg, Alemanha",
        lat: 53.5511,
        lng: 9.9937,
        date: "01/11/2024",
        status: "completed",
      },
      {
        location: "Algeciras, Espanha",
        lat: 36.1408,
        lng: -5.4536,
        date: "08/11/2024",
        status: "completed",
      },
      {
        location: "Itajai, Brasil",
        lat: -26.9078,
        lng: -48.6619,
        date: "10/12/2024",
        status: "completed",
      },
    ],
  },
  {
    id: "5",
    companyId: "company-3",
    number: "HLCU5544332",
    isFrozen: false,
    status: "em_transito",
    paymentStatus: "pendente",
    origin: "Los Angeles, EUA",
    destination: "Santos, Brasil",
    departureDate: "2024-12-05",
    arrivalForecast: "2025-01-10",
    progress: 50,
    cargo: "Eletronicos",
    weight: "12.3 ton",
    route: [
      {
        location: "Los Angeles, EUA",
        lat: 33.7501,
        lng: -118.2197,
        date: "05/12/2024",
        status: "completed",
      },
      {
        location: "Canal do Panama",
        lat: 9.08,
        lng: -79.68,
        date: "12/12/2024",
        status: "completed",
      },
      {
        location: "Cartagena, Colombia",
        lat: 10.391,
        lng: -75.4794,
        date: "18/12/2024",
        status: "current",
      },
      {
        location: "Santos, Brasil",
        lat: -23.9608,
        lng: -46.3336,
        date: "10/01/2025",
        status: "pending",
      },
    ],
  },
  {
    id: "6",
    companyId: "company-3",
    number: "EISU7788990",
    isFrozen: true,
    status: "entregue",
    paymentStatus: "ok",
    origin: "Yokohama, Japao",
    destination: "Navegantes, Brasil",
    departureDate: "2024-10-15",
    arrivalForecast: "2024-12-01",
    progress: 100,
    cargo: "Produtos Refrigerados",
    weight: "21.0 ton",
    route: [
      {
        location: "Yokohama, Japao",
        lat: 35.4437,
        lng: 139.638,
        date: "15/10/2024",
        status: "completed",
      },
      {
        location: "Manila, Filipinas",
        lat: 14.5995,
        lng: 120.9842,
        date: "22/10/2024",
        status: "completed",
      },
      {
        location: "Singapore",
        lat: 1.3521,
        lng: 103.8198,
        date: "30/10/2024",
        status: "completed",
      },
      {
        location: "Navegantes, Brasil",
        lat: -26.8986,
        lng: -48.6544,
        date: "01/12/2024",
        status: "completed",
      },
    ],
  },
];

// Default route for new containers
const createDefaultRoute = (origin: string, destination: string): MapRoutePoint[] => {
  // Simple default coordinates for common ports
  const portCoords: Record<string, { lat: number; lng: number }> = {
    Shanghai: { lat: 31.2304, lng: 121.4737 },
    Singapore: { lat: 1.3521, lng: 103.8198 },
    Rotterdam: { lat: 51.9244, lng: 4.4777 },
    Santos: { lat: -23.9608, lng: -46.3336 },
    Paranagua: { lat: -25.5163, lng: -48.5225 },
    Itajai: { lat: -26.9078, lng: -48.6619 },
    "Hong Kong": { lat: 22.3193, lng: 114.1694 },
    Hamburg: { lat: 53.5511, lng: 9.9937 },
    "Los Angeles": { lat: 33.7501, lng: -118.2197 },
  };

  const getCoords = (location: string) => {
    for (const [port, coords] of Object.entries(portCoords)) {
      if (location.toLowerCase().includes(port.toLowerCase())) {
        return coords;
      }
    }
    return { lat: 0, lng: 0 };
  };

  return [
    { location: origin, ...getCoords(origin), date: "", status: "pending" as const },
    { location: destination, ...getCoords(destination), date: "", status: "pending" as const },
  ];
};

interface CompaniesProviderProps {
  children: React.ReactNode;
}

export function CompaniesProvider({ children }: CompaniesProviderProps) {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [containers, setContainers] = useState<CompanyContainer[]>(INITIAL_CONTAINERS);

  const addCompany = useCallback((company: Omit<Company, "id" | "createdAt">) => {
    const newCompany: Company = {
      ...company,
      id: `company-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0] ?? "",
    };
    setCompanies((prev) => [...prev, newCompany]);
  }, []);

  const updateCompany = useCallback((id: string, updates: Partial<Company>) => {
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCompany = useCallback((id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    setContainers((prev) => prev.filter((c) => c.companyId !== id));
  }, []);

  const getCompanyContainers = useCallback(
    (companyId: string) => {
      return containers.filter((c) => c.companyId === companyId);
    },
    [containers]
  );

  const addContainerToCompany = useCallback(
    (
      companyId: string,
      container: Omit<
        CompanyContainer,
        "id" | "companyId" | "status" | "paymentStatus" | "progress" | "route"
      >
    ) => {
      const newContainer: CompanyContainer = {
        ...container,
        id: `container-${Date.now()}`,
        companyId,
        status: "a_embarcar",
        paymentStatus: "pendente",
        progress: 0,
        route: createDefaultRoute(container.origin, container.destination),
      };
      setContainers((prev) => [...prev, newContainer]);
    },
    []
  );

  const removeContainerFromCompany = useCallback((companyId: string, containerId: string) => {
    setContainers((prev) =>
      prev.filter((c) => !(c.companyId === companyId && c.id === containerId))
    );
  }, []);

  const getCompanyById = useCallback(
    (id: string) => {
      return companies.find((c) => c.id === id);
    },
    [companies]
  );

  const value = useMemo(
    () => ({
      companies,
      containers,
      addCompany,
      updateCompany,
      deleteCompany,
      getCompanyContainers,
      addContainerToCompany,
      removeContainerFromCompany,
      getCompanyById,
    }),
    [
      companies,
      containers,
      addCompany,
      updateCompany,
      deleteCompany,
      getCompanyContainers,
      addContainerToCompany,
      removeContainerFromCompany,
      getCompanyById,
    ]
  );

  return <CompaniesContext.Provider value={value}>{children}</CompaniesContext.Provider>;
}

export function useCompanies() {
  const context = useContext(CompaniesContext);
  if (!context) {
    throw new Error("useCompanies must be used within a CompaniesProvider");
  }
  return context;
}
