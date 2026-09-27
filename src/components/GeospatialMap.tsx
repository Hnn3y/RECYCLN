import React, { useEffect, useMemo, useState } from 'react';
import { divIcon } from 'leaflet';
import { MapContainer, Marker, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import type { Resource, Facility, Vehicle, InfrastructureReport, SatelliteDetection } from '../types/index.ts';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CircleDot,
  Crosshair,
  Factory,
  Layers3,
  MapPin,
  Package,
  Radio,
  Satellite,
  Truck,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

type EntityType = 'RESOURCE' | 'FACILITY' | 'VEHICLE' | 'INFRASTRUCTURE' | 'SATELLITE';

type EntityData = {
  RESOURCE: Resource;
  FACILITY: Facility;
  VEHICLE: Vehicle;
  INFRASTRUCTURE: InfrastructureReport;
  SATELLITE: SatelliteDetection;
};

type MapEntity<T extends EntityType = EntityType> = T extends EntityType ? {
  id: string;
  type: T;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  raw: EntityData[T];
} : never;

interface GeospatialMapProps {
  resources: Resource[];
  facilities: Facility[];
  vehicles: Vehicle[];
  reports: InfrastructureReport[];
  satelliteDetections: SatelliteDetection[];
  onSelectResource: (resource: Resource) => void;
  onSelectFacility: (facility: Facility) => void;
}

const layerConfig: Array<{
  type: EntityType;
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: 'RESOURCE', label: 'Resources', color: '#34d399', icon: Package },
  { type: 'FACILITY', label: 'Facilities', color: '#60a5fa', icon: Factory },
  { type: 'VEHICLE', label: 'Fleet vehicles', color: '#c084fc', icon: Truck },
  { type: 'INFRASTRUCTURE', label: 'Civic alerts', color: '#fbbf24', icon: AlertTriangle },
  { type: 'SATELLITE', label: 'Satellite candidates', color: '#22d3ee', icon: Satellite },
];

function createMarkerIcon(type: EntityType, selected: boolean) {
  const color = layerConfig.find((layer) => layer.type === type)?.color ?? '#34d399';
  return divIcon({
    className: 'recycln-map-marker',
    html: `<span class="recycln-marker-pin${selected ? ' is-selected' : ''}" style="--marker-color:${color}"><span></span></span>`,
    iconSize: [34, 42],
    iconAnchor: [17, 34],
  });
}

function FitMapToEntities({ points }: { points: MapEntity[] }) {
  const map = useMap();
  const coordinatesKey = points.map((point) => `${point.id}:${point.lat}:${point.lng}`).join('|');

  useEffect(() => {
    if (points.length === 0) {
      map.setView([6.54, 3.42], 11);
      return;
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
      return;
    }

    map.fitBounds(
      points.map((point) => [point.lat, point.lng] as [number, number]),
      { padding: [52, 52], maxZoom: 13 },
    );
  }, [coordinatesKey, map]);

  return null;
}

export const GeospatialMap: React.FC<GeospatialMapProps> = ({
  resources,
  facilities,
  vehicles,
  reports,
  satelliteDetections,
  onSelectResource,
  onSelectFacility,
}) => {
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Set<EntityType>>(
    () => new Set(layerConfig.map((layer) => layer.type)),
  );

  const allPoints = useMemo<MapEntity[]>(() => [
    ...resources.map((resource) => ({
      id: resource.id,
      type: 'RESOURCE' as const,
      title: resource.name,
      subtitle: `${resource.quantity} ${resource.unit} · ${resource.materialType}`,
      lat: resource.lat,
      lng: resource.lng,
      raw: resource,
    })),
    ...facilities.map((facility) => ({
      id: facility.id,
      type: 'FACILITY' as const,
      title: facility.name,
      subtitle: `${facility.availableCapacityTonnesPerMonth} t/mo open capacity`,
      lat: facility.lat,
      lng: facility.lng,
      raw: facility,
    })),
    ...vehicles.map((vehicle) => ({
      id: vehicle.id,
      type: 'VEHICLE' as const,
      title: `${vehicle.model} (${vehicle.registrationPlate})`,
      subtitle: `Status: ${vehicle.currentStatus} · ${vehicle.locationName}`,
      lat: vehicle.currentLat,
      lng: vehicle.currentLng,
      raw: vehicle,
    })),
    ...reports.map((report) => ({
      id: report.id,
      type: 'INFRASTRUCTURE' as const,
      title: report.title,
      subtitle: `${report.severity} · ${report.category.replace(/_/g, ' ')}`,
      lat: report.lat,
      lng: report.lng,
      raw: report,
    })),
    ...satelliteDetections.map((detection) => ({
      id: detection.id,
      type: 'SATELLITE' as const,
      title: detection.targetArea,
      subtitle: `Candidate ${detection.detectionType.replace(/_/g, ' ')} · ${detection.changeAreaSqm.toLocaleString()} m²`,
      lat: detection.lat,
      lng: detection.lng,
      raw: detection,
    })),
  ], [resources, facilities, vehicles, reports, satelliteDetections]);

  const visiblePoints = useMemo(
    () => allPoints.filter((point) => visibleLayers.has(point.type)),
    [allPoints, visibleLayers],
  );
  const criticalReports = reports.filter((report) => report.severity === 'CRITICAL' || report.severity === 'HIGH').length;

  const toggleLayer = (type: EntityType) => {
    setVisibleLayers((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const selectEntity = (entity: MapEntity) => setSelectedEntity(entity);

  return (
    <section className="space-y-5" aria-label="Lagos geospatial operations map">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live operations · Lagos, Nigeria
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Network intelligence</h1>
          <p className="mt-1 text-sm text-neutral-400">Explore resources, processing capacity, fleet activity and field alerts.</p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-2 text-xs text-neutral-300 xl:self-auto">
          <Radio className="h-3.5 w-3.5 text-emerald-400" />
          <span>Network online</span>
          <span className="mx-1 h-3 w-px bg-neutral-700" />
          <span className="font-mono tabular-nums text-neutral-400">{visiblePoints.length} nodes in view</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'Material sources', value: resources.length, icon: Package, color: 'text-emerald-400' },
          { label: 'Facilities', value: facilities.length, icon: Factory, color: 'text-blue-400' },
          { label: 'Active fleet', value: vehicles.length, icon: Truck, color: 'text-purple-400' },
          { label: 'Priority alerts', value: criticalReports, icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Satellite candidates', value: satelliteDetections.length, icon: Satellite, color: 'text-cyan-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/70 px-3.5 py-3">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-neutral-800/80 ${color}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-semibold leading-tight text-white tabular-nums">{value}</span>
              <span className="block truncate text-[10px] uppercase tracking-wide text-neutral-500">{label}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="grid min-h-[680px] grid-cols-1 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/20 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-[520px] border-b border-neutral-800 bg-[#10191a] xl:min-h-[680px] xl:border-b-0 xl:border-r">
          <MapContainer
            center={[6.54, 3.42]}
            zoom={11}
            zoomControl={false}
            scrollWheelZoom
            className="h-full min-h-[520px] w-full bg-[#10191a] xl:min-h-[680px]"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={20}
            />
            <ZoomControl position="bottomright" />
            <FitMapToEntities points={visiblePoints} />
            {visiblePoints.map((point) => (
              <Marker
                key={point.id}
                position={[point.lat, point.lng]}
                icon={createMarkerIcon(point.type, selectedEntity?.id === point.id)}
                eventHandlers={{ click: () => selectEntity(point) }}
                title={point.title}
              />
            ))}
          </MapContainer>

          <div className="pointer-events-none absolute left-4 top-4 z-[500] flex items-center gap-2 rounded-lg border border-white/10 bg-neutral-950/85 px-3 py-2 shadow-lg backdrop-blur-md">
            <Crosshair className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-white">Lagos industrial corridor</span>
            <span className="hidden border-l border-neutral-700 pl-2 font-mono text-[10px] text-neutral-400 sm:inline">6.5244° N · 3.3792° E</span>
          </div>

          <div className="pointer-events-none absolute bottom-4 left-4 z-[500] flex items-center gap-2 rounded-md border border-white/10 bg-neutral-950/85 px-2.5 py-1.5 text-[10px] text-neutral-300 shadow-lg backdrop-blur-md">
            <Layers3 className="h-3 w-3 text-emerald-400" />
            <span>EPSG:4326</span>
            <span className="text-neutral-600">/</span>
            <span>{visiblePoints.length} mapped records</span>
          </div>
        </div>

        <aside className="flex min-h-[520px] flex-col bg-neutral-900 xl:min-h-[680px]" aria-label="Map layers and selected node">
          <div className="border-b border-neutral-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Layers3 className="h-4 w-4 text-emerald-400" />
                Map layers
              </div>
              <button
                type="button"
                onClick={() => setVisibleLayers(new Set(layerConfig.map((layer) => layer.type)))}
                className="text-[10px] font-medium text-neutral-500 transition hover:text-emerald-400"
              >
                Show all
              </button>
            </div>
            <div className="space-y-1">
              {layerConfig.map(({ type, label, color, icon: Icon }) => {
                const isVisible = visibleLayers.has(type);
                const count = allPoints.filter((point) => point.type === type).length;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={isVisible}
                    onClick={() => toggleLayer(type)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${isVisible ? 'bg-neutral-800/70' : 'opacity-50 hover:bg-neutral-800/40'}`}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-neutral-800" style={{ color }}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1 text-xs text-neutral-200">{label}</span>
                    <span className="font-mono text-[10px] tabular-nums text-neutral-500">{count}</span>
                    <span className={`grid h-4 w-4 place-items-center rounded border ${isVisible ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400' : 'border-neutral-700 text-transparent'}`}>
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedEntity ? (
            <div className="flex-1 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  Selected node
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEntity(null)}
                  className="rounded-md px-2 py-1 text-[10px] text-neutral-500 transition hover:bg-neutral-800 hover:text-white"
                >
                  Clear
                </button>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3.5">
                <div className="mb-3 flex items-start gap-2.5">
                  <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: layerConfig.find((layer) => layer.type === selectedEntity.type)?.color }} />
                  <div className="min-w-0">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-neutral-500">{selectedEntity.type.replace('_', ' ')}</div>
                    <h2 className="mt-1 text-sm font-semibold leading-snug text-white">{selectedEntity.title}</h2>
                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">{selectedEntity.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-800 py-2 text-[10px] text-neutral-500">
                  <span>Coordinates</span>
                  <span className="font-mono tabular-nums text-neutral-300">{selectedEntity.lat.toFixed(4)}, {selectedEntity.lng.toFixed(4)}</span>
                </div>

                {selectedEntity.type === 'RESOURCE' && (
                  <>
                    <div className="flex items-center justify-between border-t border-neutral-800 py-2 text-[10px]">
                      <span className="text-neutral-500">Estimated value</span>
                      <span className="font-mono tabular-nums text-emerald-400">{selectedEntity.raw.currency} {selectedEntity.raw.estimatedValue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-800 py-2 text-[10px]">
                      <span className="text-neutral-500">Condition</span>
                      <span className="text-neutral-300">{selectedEntity.raw.condition}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectResource(selectedEntity.raw)}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-neutral-950 transition hover:bg-emerald-300"
                    >
                      Open resource passport <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}

                {selectedEntity.type === 'FACILITY' && (
                  <>
                    <div className="flex items-center justify-between border-t border-neutral-800 py-2 text-[10px]">
                      <span className="text-neutral-500">Facility type</span>
                      <span className="text-neutral-300">{selectedEntity.raw.facilityType.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-800 py-2 text-[10px]">
                      <span className="text-neutral-500">Open capacity</span>
                      <span className="font-mono tabular-nums text-blue-400">{selectedEntity.raw.availableCapacityTonnesPerMonth.toLocaleString()} t/mo</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectFacility(selectedEntity.raw)}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-400 px-3 py-2 text-xs font-semibold text-neutral-950 transition hover:bg-blue-300"
                    >
                      View facility <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}

                {selectedEntity.type === 'VEHICLE' && (
                  <div className="flex items-center justify-between border-t border-neutral-800 py-2 text-[10px]">
                    <span className="text-neutral-500">Current status</span>
                    <span className="text-purple-300">{selectedEntity.raw.currentStatus.replace(/_/g, ' ')}</span>
                  </div>
                )}

                {selectedEntity.type === 'INFRASTRUCTURE' && (
                  <div className="flex items-center justify-between border-t border-neutral-800 py-2 text-[10px]">
                    <span className="text-neutral-500">Verification</span>
                    <span className={selectedEntity.raw.humanVerified ? 'text-emerald-400' : 'text-amber-400'}>
                      {selectedEntity.raw.humanVerified ? 'Human verified' : 'Ground check pending'}
                    </span>
                  </div>
                )}

                {selectedEntity.type === 'SATELLITE' && (
                  <div className="mt-2 rounded-lg border border-amber-900/60 bg-amber-950/25 p-2.5 text-[10px] leading-relaxed text-amber-200">
                    Candidate detection only. Ground verification is required before treating this as a confirmed site.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                Network activity
              </div>
              <div className="space-y-1 overflow-y-auto">
                {visiblePoints.slice(0, 8).map((point) => {
                  const layer = layerConfig.find((item) => item.type === point.type)!;
                  const Icon = layer.icon;
                  return (
                    <button
                      key={point.id}
                      type="button"
                      onClick={() => selectEntity(point)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-neutral-800"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-neutral-800" style={{ color: layer.color }}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs text-neutral-200">{point.title}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-neutral-500">{point.subtitle}</span>
                      </span>
                      <MapPin className="h-3 w-3 shrink-0 text-neutral-600" />
                    </button>
                  );
                })}
                {visiblePoints.length === 0 && (
                  <div className="rounded-lg border border-dashed border-neutral-800 p-4 text-center text-xs text-neutral-500">
                    <CircleDot className="mx-auto mb-2 h-4 w-4" />
                    No nodes in visible layers.
                  </div>
                )}
              </div>
              {visiblePoints.length > 8 && (
                <div className="mt-auto border-t border-neutral-800 pt-3 text-center text-[10px] text-neutral-500">
                  Showing 8 of {visiblePoints.length} nodes · select a map marker to inspect
                </div>
              )}
            </div>
          )}

          <div className="border-t border-neutral-800 px-4 py-3 text-[10px] text-neutral-500">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> Lagos operations region</span>
              <span className="font-mono">WGS 84</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};