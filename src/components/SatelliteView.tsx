import React from 'react';
import type { SatelliteDetection, User, Organization } from '../types/index.ts';
import {
  Satellite,
  AlertTriangle,
  Layers,
  MapPin,
  Calendar,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface SatelliteViewProps {
  detections: SatelliteDetection[];
  currentUser: User | null;
  currentOrg: Organization | null;
  onRefresh: () => void;
}

export const SatelliteView: React.FC<SatelliteViewProps> = ({
  detections,
  currentUser,
  currentOrg,
  onRefresh,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            SpaceTech & Earth Observation Intelligence
          </h1>
          <div className="text-xs text-neutral-400 mt-1">
            Sentinel-2 multispectral NDVI & radar backscatter change detection for dumpsites and scrap accumulation
          </div>
        </div>

        {/* Mandatory Candidate Disclaimer (Strict prompt rule) */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/40 border border-amber-800/80 rounded-lg text-xs text-amber-300">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Candidate Detections Only — Never automatically confirmed physical facts</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {detections.map((det) => (
          <div
            key={det.id}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 hover:border-neutral-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[10px] uppercase font-mono text-cyan-400">
                    <Satellite className="w-3.5 h-3.5" />
                    <span>{det.sourceSatellite} ORTHOMOSAIC FEED</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mt-1">{det.targetArea}</h3>
                  <div className="text-xs text-neutral-400">
                    Anomaly Type: {det.detectionType.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
                    {det.confidenceScore}%
                  </div>
                  <div className="text-[10px] text-neutral-500 uppercase">Algorithm Score</div>
                </div>
              </div>

              {/* Spatial Coordinates & Surface Change Metrics */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono">
                <div>
                  <div className="text-neutral-500 text-[10px] uppercase">Surface Delta</div>
                  <div className="text-white font-semibold tabular-nums mt-0.5">{det.changeAreaSqm} m²</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[10px] uppercase">Imagery Date</div>
                  <div className="text-neutral-300 tabular-nums mt-0.5">{det.imageryDate}</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[10px] uppercase">Status</div>
                  <div className="text-amber-400 font-semibold mt-0.5 truncate">{det.status}</div>
                </div>
              </div>

              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-lg text-xs text-neutral-300 space-y-1">
                <div className="font-semibold text-neutral-200">Multispectral Spectral Anomaly Analysis:</div>
                <p className="text-[11px] leading-relaxed text-neutral-400">{det.candidateNotes}</p>
              </div>

              <div className="text-[11px] font-mono text-neutral-500 flex items-center justify-between">
                <span>Center: {det.lat.toFixed(4)}° N, {det.lng.toFixed(4)}° E</span>
                <span>Bounds: [{det.bounds.south}, {det.bounds.west}]</span>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-xs text-neutral-500">Requires Ground Truth Inspection</span>
              <button
                onClick={() => alert(`Inspection task dispatched for ${det.targetArea}. Field Agent notified.`)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <span>Dispatch Ground Verification</span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
