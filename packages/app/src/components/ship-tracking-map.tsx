import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";

// Route point with coordinates
export interface MapRoutePoint {
  location: string;
  lat: number;
  lng: number;
  date: string;
  status: "completed" | "current" | "pending";
}

interface ShipTrackingMapProps {
  route: MapRoutePoint[];
  containerNumber: string;
  progress: number;
}

// Custom ship icon (SVG)
const createShipIcon = () => {
  return L.divIcon({
    className: "ship-marker",
    html: `
      <div class="ship-icon-container">
        <div class="ship-pulse"></div>
        <div class="ship-pulse ship-pulse-2"></div>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ship-svg">
          <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
          <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
          <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
          <path d="M12 10v4"/>
          <path d="M12 2v3"/>
        </svg>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

// Port marker icon
const createPortIcon = (
  status: "completed" | "current" | "pending",
  isOrigin: boolean,
  isDestination: boolean
) => {
  let color = "#6b7280"; // gray for pending
  let bgColor = "rgba(107, 114, 128, 0.2)";

  if (status === "completed") {
    color = "#10b981"; // green
    bgColor = "rgba(16, 185, 129, 0.2)";
  } else if (status === "current") {
    color = "#E53935"; // primary red
    bgColor = "rgba(229, 57, 53, 0.2)";
  }

  if (isOrigin) {
    color = "#3b82f6"; // blue for origin
    bgColor = "rgba(59, 130, 246, 0.2)";
  }
  if (isDestination) {
    color = "#E53935"; // red for destination
    bgColor = "rgba(229, 57, 53, 0.2)";
  }

  return L.divIcon({
    className: "port-marker",
    html: `
      <div class="port-icon" style="--port-color: ${color}; --port-bg: ${bgColor}">
        <div class="port-ring"></div>
        <div class="port-dot"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Component to fit bounds
function FitBounds({ route }: { route: MapRoutePoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (route.length > 0) {
      const bounds = L.latLngBounds(route.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, route]);

  return null;
}

// Calculate ship position based on progress
function calculateShipPosition(route: MapRoutePoint[], progress: number): [number, number] {
  if (route.length < 2) return [route[0]?.lat ?? 0, route[0]?.lng ?? 0];

  // Find current segment based on status
  const currentIndex = route.findIndex((p) => p.status === "current");

  if (currentIndex === -1) {
    // If no current, use progress to determine position
    if (progress >= 100) {
      const last = route[route.length - 1];
      return [last?.lat ?? 0, last?.lng ?? 0];
    }
    if (progress <= 0) {
      return [route[0]?.lat ?? 0, route[0]?.lng ?? 0];
    }
  }

  // Get the current point coordinates
  const currentPoint = route[currentIndex];
  if (currentPoint) {
    return [currentPoint.lat, currentPoint.lng];
  }

  return [route[0]?.lat ?? 0, route[0]?.lng ?? 0];
}

export function ShipTrackingMap({ route, containerNumber, progress }: ShipTrackingMapProps) {
  const shipIcon = useMemo(() => createShipIcon(), []);
  const shipPosition = useMemo(() => calculateShipPosition(route, progress), [route, progress]);

  // Split route into completed and pending segments
  const completedRoute = route.filter((p) => p.status === "completed" || p.status === "current");
  const pendingRoute = route.filter((p) => p.status === "pending" || p.status === "current");

  const completedCoords: [number, number][] = completedRoute.map((p) => [p.lat, p.lng]);
  const pendingCoords: [number, number][] = pendingRoute.map((p) => [p.lat, p.lng]);

  // Default center (Atlantic Ocean)
  const defaultCenter: [number, number] = [0, -30];

  return (
    <div className="ship-tracking-map-container">
      {/* Map Styles */}
      <style>{`
        .ship-tracking-map-container {
          position: relative;
          width: 100%;
          height: 300px;
          border-radius: 12px;
          overflow: hidden;
          background: #f8fafc;
        }

        .ship-tracking-map-container .leaflet-container {
          width: 100%;
          height: 100%;
          background: transparent;
        }

        .ship-tracking-map-container .leaflet-control-attribution {
          background: rgba(255, 255, 255, 0.8) !important;
          color: rgba(0, 0, 0, 0.5) !important;
          font-size: 9px;
          padding: 2px 6px;
        }

        .ship-tracking-map-container .leaflet-control-attribution a {
          color: rgba(0, 0, 0, 0.6) !important;
        }

        .ship-tracking-map-container .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
        }

        .ship-tracking-map-container .leaflet-control-zoom a {
          background: white !important;
          color: #374151 !important;
          border: 1px solid #e5e7eb !important;
        }

        .ship-tracking-map-container .leaflet-control-zoom a:hover {
          background: #E53935 !important;
          color: white !important;
        }

        /* Ship marker styles */
        .ship-marker {
          background: transparent !important;
          border: none !important;
        }

        .ship-icon-container {
          position: relative;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ship-pulse {
          position: absolute;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(229, 57, 53, 0.3);
          animation: ship-pulse-anim 2s ease-out infinite;
        }

        .ship-pulse-2 {
          animation-delay: 1s;
        }

        @keyframes ship-pulse-anim {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .ship-svg {
          position: relative;
          z-index: 10;
          color: white;
          filter: drop-shadow(0 2px 8px rgba(229, 57, 53, 0.6));
          background: #E53935;
          padding: 6px;
          border-radius: 50%;
          width: 36px;
          height: 36px;
        }

        /* Port marker styles */
        .port-marker {
          background: transparent !important;
          border: none !important;
        }

        .port-icon {
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .port-ring {
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid var(--port-color);
          background: var(--port-bg);
          animation: port-pulse 3s ease-in-out infinite;
        }

        .port-dot {
          position: relative;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--port-color);
          z-index: 1;
        }

        @keyframes port-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }

        /* Tooltip styles */
        .ship-tracking-map-container .leaflet-tooltip {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          color: #1f2937;
          font-size: 12px;
          padding: 8px 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .ship-tracking-map-container .leaflet-tooltip::before {
          border-top-color: white;
        }

        .tooltip-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tooltip-location {
          font-weight: 600;
          color: #1f2937;
        }

        .tooltip-date {
          font-size: 10px;
          color: #6b7280;
        }

        .tooltip-status {
          font-size: 10px;
          margin-top: 4px;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
          width: fit-content;
        }

        .tooltip-status.completed {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .tooltip-status.current {
          background: rgba(229, 57, 53, 0.2);
          color: #E53935;
        }

        .tooltip-status.pending {
          background: rgba(107, 114, 128, 0.15);
          color: #6b7280;
        }

        /* Map overlay gradient */
        .map-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 50px;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
          pointer-events: none;
          z-index: 1000;
        }

        .map-overlay-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 30px;
          background: linear-gradient(to top, rgba(255, 255, 255, 0.2), transparent);
          pointer-events: none;
          z-index: 1000;
        }

        /* Container info badge */
        .map-container-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 12px;
          z-index: 1001;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .map-container-badge .badge-icon {
          width: 24px;
          height: 24px;
          background: #E53935;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .map-container-badge .badge-icon svg {
          width: 14px;
          height: 14px;
          color: white;
        }

        .map-container-badge .badge-text {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 11px;
          font-weight: 600;
          color: #1f2937;
          letter-spacing: 0.5px;
        }

        /* Progress indicator */
        .map-progress-indicator {
          position: absolute;
          top: 12px;
          right: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 12px;
          z-index: 1001;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .map-progress-indicator .progress-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6b7280;
        }

        .map-progress-indicator .progress-value {
          font-size: 18px;
          font-weight: 700;
          color: #E53935;
        }
      `}</style>

      {/* Overlay gradients */}
      <div className="map-overlay" />
      <div className="map-overlay-bottom" />

      {/* Container badge */}
      <div className="map-container-badge">
        <div className="badge-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" />
            <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" />
          </svg>
        </div>
        <span className="badge-text">{containerNumber}</span>
      </div>

      {/* Progress indicator */}
      <div className="map-progress-indicator">
        <span className="progress-label">Progresso</span>
        <span className="progress-value">{progress}%</span>
      </div>

      {/* Map */}
      <MapContainer
        center={defaultCenter}
        zoom={2}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <FitBounds route={route} />

        {/* Completed route (solid line) */}
        {completedCoords.length > 1 && (
          <Polyline
            positions={completedCoords}
            pathOptions={{
              color: "#10b981",
              weight: 3,
              opacity: 0.8,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {/* Pending route (dashed line) */}
        {pendingCoords.length > 1 && (
          <Polyline
            positions={pendingCoords}
            pathOptions={{
              color: "#6b7280",
              weight: 2,
              opacity: 0.5,
              dashArray: "8, 12",
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {/* Port markers */}
        {route.map((point, index) => (
          <Marker
            key={point.location}
            position={[point.lat, point.lng]}
            icon={createPortIcon(point.status, index === 0, index === route.length - 1)}
          >
            <Tooltip direction="top" offset={[0, -12]} permanent={false}>
              <div className="tooltip-content">
                <span className="tooltip-location">{point.location}</span>
                <span className="tooltip-date">{point.date}</span>
                <span className={`tooltip-status ${point.status}`}>
                  {point.status === "completed"
                    ? "Concluido"
                    : point.status === "current"
                      ? "Posicao Atual"
                      : "Pendente"}
                </span>
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* Ship marker at current position */}
        <Marker position={shipPosition} icon={shipIcon}>
          <Tooltip direction="top" offset={[0, -24]} permanent={false}>
            <div className="tooltip-content">
              <span className="tooltip-location">Navio em Transito</span>
              <span className="tooltip-date">{containerNumber}</span>
            </div>
          </Tooltip>
        </Marker>
      </MapContainer>
    </div>
  );
}
