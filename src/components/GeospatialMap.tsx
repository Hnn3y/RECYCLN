import React, { useState } from 'react';
import type { Resource, Facility, Vehicle, InfrastructureReport, SatelliteDetection } from '../types/index.ts';
import {
  MapPin,
  Truck,
  Factory,
  AlertTriangle,
  Satellite,
  Compass,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface GeospatialMapProps {
  resources: Resource[];
  facilities: Facility[];
  vehicles: Vehicle[];
  reports: InfrastructureReport[];
  satelliteDetections: SatelliteDetection[];
  onSelectResource: (resource: Resource) => void;
  onSelectFacility: (facility: Facility) => void;
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
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [radiusFilter, setRadiusFilter] = useState<number>(60);

  // Center coordinate around Lagos Industrial Corridor (lat: 6.5244, lng: 3.3792)
  const mapCenter = { lat: 6.54, lng: 3.42 };

  // Convert lat/lng to relative SVG percentage coordinates for the interactive viewport
  const projectCoords = (lat: number, lng: number) => {
    // Lagos bounding box approx: lat 6.38 - 6.66, lng 3.15 - 3.68
    const minLat = 6.38;
    const maxLat = 6.66;
    const minLng = 3.15;
    const maxLng = 3.68;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  const allPoints: Array<{
    id: string;
    type: 'RESOURCE' | 'FACILITY' | 'VEHICLE' | 'INFRASTRUCTURE' | 'SATELLITE';
    title: string;
    subtitle: string;
    lat: number;
    lng: number;
    raw: any;
  }> = [];

  if (filterType === 'all' || filterType === 'resources') {
    resources.forEach((r) => {
      allPoints.push({
        id: r.id,
        type: 'RESOURCE',
        title: r.name,
        subtitle: `${r.quantity} ${r.unit} · ${r.materialType}`,
        lat: r.lat,
        lng: r.lng,
        raw: r,
      });
    });
  }

  if (filterType === 'all' || filterType === 'facilities') {
    facilities.forEach((f) => {
      allPoints.push({
        id: f.id,
        type: 'FACILITY',
        title: f.name,
        subtitle: `${f.availableCapacityTonnesPerMonth} t/mo open capacity`,
        lat: f.lat,
        lng: f.lng,
        raw: f,
      });
    });
  }

  if (filterType === 'all' || filterType === 'vehicles') {
    vehicles.forEach((v) => {
      allPoints.push({
        id: v.id,
        type: 'VEHICLE',
        title: `${v.model} (${v.registrationPlate})`,
        subtitle: `Status: ${v.currentStatus} · ${v.locationName}`,
        lat: v.currentLat,
        lng: v.currentLng,
        raw: v,
      });
    });
  }

  if (filterType === 'all' || filterType === 'infrastructure') {
    reports.forEach((rep) => {
      allPoints.push({
        id: rep.id,
        type: 'INFRASTRUCTURE',
        title: rep.title,
        subtitle: `${rep.severity} · ${rep.category.replace('_', ' ')}`,
        lat: rep.lat,
        lng: rep.lng,
        raw: rep,
      });
    });
  }

  if (filterType === 'all' || filterType === 'satellite') {
    satelliteDetections.forEach((sat) => {
      allPoints.push({
        id: sat.id,
        type: 'SATELLITE',
        title: sat.targetArea,
        subtitle: `Candidate ${sat.detectionType.replace('_', ' ')} (${sat.changeAreaSqm} m²)`,
        lat: sat.lat,
        lng: sat.lng,
        raw: sat,
      });
    });
  }

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <Compass className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-base font-semibold text-white">Geospatial Resource Network</h2>
            <div className="text-xs text-neutral-400">
              Real-time PostGIS coordinate grid & industrial node topology
            </div>
          </div>
        </div>

        {/* Filter Segmented Control (Zero-Pill compliant functional buttons) */}
        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'all' ? 'bg-neutral-800 text-emerald-400 shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Nodes ({allPoints.length})
          </button>
          <button
            onClick={() => setFilterType('resources')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'resources' ? 'bg-neutral-800 text-emerald-400 shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Resources ({resources.length})
          </button>
          <button
            onClick={() => setFilterType('facilities')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'facilities' ? 'bg-neutral-800 text-emerald-400 shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Facilities ({facilities.length})
          </button>
          <button
            onClick={() => setFilterType('vehicles')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'vehicles' ? 'bg-neutral-800 text-emerald-400 shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Fleet ({vehicles.length})
          </button>
          <button
            onClick={() => setFilterType('infrastructure')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'infrastructure' ? 'bg-neutral-800 text-amber-400 shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Civic Reports ({reports.length})
          </button>
          <button
            onClick={() => setFilterType('satellite')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'satellite' ? 'bg-neutral-800 text-cyan-400 shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Satellite Intel ({satelliteDetections.length})
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative w-full h-[520px] bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Subtle SVG Grid overlay simulating PostGIS geographic raster */}
        <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#262626" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Major simulated transit corridors and coastline */}
          <path
            d="M 10 90 Q 30 70 55 60 T 95 40"
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="opacity-40"
          />
          <path
            d="M 5 45 Q 40 40 60 50 T 90 75"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeDasharray="2 3"
            className="opacity-30"
          />
        </svg>

        {/* Spatial Legend Overlay */}
        <div className="absolute top-4 left-4 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 p-3 rounded-lg text-xs space-y-2 z-10">
          <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Map Layers</span>
          </div>
          <div className="space-y-1 text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Physical Resources</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span>Processing Facilities</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>Haulage Fleet Vehicles</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Infrastructure Alerts</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Sentinel Candidate Hotspot</span>
            </div>
          </div>
        </div>

        {/* Map Coordinates & Projection Telemetry in bottom corner */}
        <div className="absolute bottom-4 left-4 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 px-3 py-1.5 rounded-md text-[11px] font-mono text-neutral-400 tabular-nums z-10">
          CRS: EPSG:4326 · Center: 6.5400° N, 3.4200° E · Active Nodes: {allPoints.length}
        </div>

        {/* Interactive Spatial Node Markers */}
        <div className="absolute inset-0 p-8">
          {allPoints.map((point) => {
            const coords = projectCoords(point.lat, point.lng);
            const isSelected = selectedEntity?.id === point.id;

            let markerColor = 'bg-emerald-500 border-emerald-300';
            let IconComponent = MapPin;

            if (point.type === 'FACILITY') {
              markerColor = 'bg-blue-500 border-blue-300';
              IconComponent = Factory;
            } else if (point.type === 'VEHICLE') {
              markerColor = 'bg-purple-500 border-purple-300';
              IconComponent = Truck;
            } else if (point.type === 'INFRASTRUCTURE') {
              markerColor = 'bg-amber-500 border-amber-300';
              IconComponent = AlertTriangle;
            } else if (point.type === 'SATELLITE') {
              markerColor = 'bg-cyan-500 border-cyan-300 animate-pulse';
              IconComponent = Satellite;
            }

            return (
              <div
                key={point.id}
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                onClick={() => setSelectedEntity(point)}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white border transition-transform duration-200 ${
                    isSelected ? 'scale-125 ring-4 ring-emerald-500/40 ' + markerColor : markerColor + ' hover:scale-115'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </div>

                {/* Hover Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block bg-neutral-900 text-white text-[11px] px-2.5 py-1 rounded shadow-lg whitespace-nowrap border border-neutral-800 z-20">
                  <div className="font-semibold">{point.title}</div>
                  <div className="text-neutral-400">{point.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Entity Inspector Panel (Floating Sheet) */}
        {selectedEntity && (
          <div className="absolute top-4 right-4 w-80 bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-2xl z-30 animate-in fade-in slide-in-from-right-2 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">
                  {selectedEntity.type} INSPECTION
                </span>
                <h3 className="text-sm font-semibold text-white mt-0.5">{selectedEntity.title}</h3>
                <div className="text-xs text-neutral-400 mt-0.5">{selectedEntity.subtitle}</div>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-neutral-500 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>GPS Coordinates</span>
                <span className="font-mono text-neutral-200 tabular-nums">
                  {selectedEntity.lat.toFixed(4)}°, {selectedEntity.lng.toFixed(4)}°
                </span>
              </div>

              {selectedEntity.type === 'RESOURCE' && (
                <>
                  <div className="flex justify-between text-neutral-400">
                    <span>Estimated Value</span>
                    <span className="font-mono font-medium text-emerald-400 tabular-nums">
                      ${selectedEntity.raw.estimatedValue.toLocaleString()} {selectedEntity.raw.currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Condition</span>
                    <span className="text-neutral-200">{selectedEntity.raw.condition}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Passport Batch</span>
                    <span className="font-mono text-neutral-300">{selectedEntity.raw.passportId}</span>
                  </div>
                  <button
                    onClick={() => onSelectResource(selectedEntity.raw)}
                    className="w-full mt-2 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium rounded-md transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View Resource Passport</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {selectedEntity.type === 'FACILITY' && (
                <>
                  <div className="flex justify-between text-neutral-400">
                    <span>Facility Type</span>
                    <span className="text-neutral-200">{selectedEntity.raw.facilityType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Monthly Open Capacity</span>
                    <span className="font-mono text-blue-400 tabular-nums">
                      {selectedEntity.raw.availableCapacityTonnesPerMonth} tonnes
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectFacility(selectedEntity.raw)}
                    className="w-full mt-2 py-1.5 px-3 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-md transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Reserve Capacity</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {selectedEntity.type === 'SATELLITE' && (
                <div className="p-2 bg-neutral-950 border border-neutral-800 rounded text-[11px] text-amber-300">
                  <div className="font-semibold mb-0.5">Ground Verification Required</div>
                  Candidate detection from {selectedEntity.raw.sourceSatellite}. Does not constitute a verified physical site until inspector ground-truth check.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
