import React, { useEffect, useState } from 'react';
import type { SatelliteDetection, User, Organization } from '../types/index.ts';
import { api } from '../services/api.ts';
import { SatelliteDetectionMap } from './SatelliteDetectionMap.tsx';
import {
  Satellite,
  AlertTriangle,
  ShieldAlert,
  LoaderCircle,
  ScanSearch,
  CircleCheck,
} from 'lucide-react';

interface SatelliteViewProps {
  detections: SatelliteDetection[];
  currentUser: User | null;
  currentOrg: Organization | null;
  onRefresh: () => void | Promise<void>;
}

export const SatelliteView: React.FC<SatelliteViewProps> = ({
  detections,
  currentUser,
  currentOrg,
  onRefresh,
}) => {
  const [scanStatus, setScanStatus] = useState<Awaited<ReturnType<typeof api.getSatelliteScanStatus>> | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.getSatelliteScanStatus()
      .then((status) => {
        setScanStatus(status);
        setSelectedRegionId((current) => current || status.regions[0]?.id || '');
      })
      .catch((error: Error) => setScanMessage({ kind: 'error', text: error.message }));
  }, []);

  const handleSatelliteScan = async () => {
    if (!selectedRegionId) return;
    setIsScanning(true);
    setScanMessage(null);
    try {
      const result = await api.scanSatelliteRegion(selectedRegionId);
      const sceneDay = result.scene.datetime.slice(0, 10);
      setScanMessage({
        kind: 'success',
        text: result.detections.length
          ? `Screened NASA VIIRS imagery from ${sceneDay}; ${result.detections.length} broad anomaly pin${result.detections.length === 1 ? '' : 's'} added to the live map.`
          : `Screened NASA VIIRS imagery from ${sceneDay}; AI found no broad anomaly candidates in this scan tile.`,
      });
      await onRefresh();
    } catch (error) {
      setScanMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Satellite scan failed.' });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            SpaceTech & Earth Observation Intelligence
          </h1>
          <div className="text-xs text-neutral-400 mt-1">
            Screen NASA satellite imagery for broad visual anomalies and route approximate candidate areas for field review
          </div>
        </div>

        {/* Mandatory Candidate Disclaimer (Strict prompt rule) */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/40 border border-amber-800/80 rounded-lg text-xs text-amber-300">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Candidate Detections Only — Never automatically confirmed physical facts</span>
        </div>
      </div>

      <SatelliteDetectionMap
        detections={detections}
        imageryDate={scanStatus?.imageryDate || undefined}
        reporterName={currentUser?.name}
        reporterOrgName={currentOrg?.name}
        onReportCreated={async () => { await onRefresh(); }}
      />

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5" aria-label="Run a live satellite screening">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ScanSearch className="h-4 w-4 text-cyan-400" />
              NASA GIBS + AI regional screening
            </div>
            <p className="mt-1 text-xs leading-relaxed text-neutral-400">
              Select a Nigeria scan area. The server retrieves recent NASA EOSDIS GIBS VIIRS NOAA-20 imagery and asks Gemini to screen for broad visible anomalies. Findings are saved as approximate candidate pins on Network Map.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedRegionId}
              onChange={(event) => setSelectedRegionId(event.target.value)}
              disabled={!scanStatus?.regions.length || isScanning}
              aria-label="Nigeria satellite scan area"
              className="min-w-56 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 disabled:opacity-50"
            >
              {scanStatus?.regions.length ? scanStatus.regions.map((region) => (
                <option key={region.id} value={region.id}>{region.name} · {region.state}</option>
              )) : <option value="">Loading scan areas…</option>}
            </select>
            <button
              type="button"
              onClick={handleSatelliteScan}
              disabled={!scanStatus?.configured || !scanStatus.imageryAvailable || !selectedRegionId || isScanning}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-neutral-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isScanning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Satellite className="h-4 w-4" />}
              {isScanning ? 'Screening NASA imagery…' : 'Screen NASA imagery'}
            </button>
          </div>
        </div>

        {scanStatus && !scanStatus.configured && (
          <div className="mt-3 rounded-lg border border-amber-900/70 bg-amber-950/25 px-3 py-2 text-[11px] text-amber-200">
            Live screening is not configured. Add <span className="font-mono">{scanStatus.missing.join(', ')}</span> to the server-side .env and restart the server. Never use VITE_ for these secrets.
          </div>
        )}
        {scanStatus && (
          <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-950/70 px-3 py-2 text-[10px] leading-relaxed text-neutral-400">
            Source: {scanStatus.imagerySource}. {scanStatus.imageryAvailable ? `Latest tile reachable: ${scanStatus.imageryDate}.` : `NASA imagery is currently unavailable: ${scanStatus.imageryError || 'no recent tile found'}`} {scanStatus.nasaOpenApiKeyConfigured ? 'NASA_OPEN_API is present in the server environment.' : 'NASA_OPEN_API is not set.'} {scanStatus.nasaOpenApiKeyNote}
          </div>
        )}
        {scanMessage && (
          <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[11px] ${scanMessage.kind === 'success' ? 'border-emerald-900/70 bg-emerald-950/25 text-emerald-200' : 'border-red-900/70 bg-red-950/25 text-red-200'}`} role="status">
            {scanMessage.kind === 'success' ? <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
            <span>{scanMessage.text}</span>
          </div>
        )}
        <div className="mt-3 flex items-start gap-2 border-t border-neutral-800 pt-3 text-[10px] leading-relaxed text-neutral-500">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span>Coverage is limited to these regional tiles, not all of Nigeria. NASA VIIRS imagery is hundreds of metres per pixel; it cannot resolve individual dumpsites or support precise pins. AI results are only broad anomaly leads, never confirmed dumpsites. Use higher-resolution imagery and field inspection to verify.</span>
        </div>
      </section>

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
                    <span>{det.sourceSatellite} · {det.detectionSource === 'LIVE_NASA_AI' ? 'NASA AI AREA LEAD' : det.detectionSource === 'FIELD_REPORTED' ? 'USER-REPORTED · UNVERIFIED' : 'DEMO RECORD'}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mt-1">{det.targetArea}</h3>
                  <div className="text-xs text-neutral-400">
                    Anomaly Type: {det.detectionType.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
                    {det.confidenceScore}<span className="text-xs text-neutral-500">/100</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 uppercase">{det.detectionSource === 'LIVE_NASA_AI' ? 'Model screen /100' : det.detectionSource === 'FIELD_REPORTED' ? 'No AI score' : 'Demo score hidden'}</div>
                </div>
              </div>

              {/* Spatial Coordinates & Surface Change Metrics */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono">
                <div>
                  <div className="text-neutral-500 text-[10px] uppercase">Area estimate</div>
                  <div className="text-white font-semibold tabular-nums mt-0.5">{det.changeAreaSqm ? `${det.changeAreaSqm.toLocaleString()} m²` : 'Not estimated'}</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[10px] uppercase">Imagery Date</div>
                  <div className="text-neutral-300 tabular-nums mt-0.5">{det.detectionSource === 'FIELD_REPORTED' ? (det.reportedAt || det.imageryDate).slice(0, 10) : det.imageryDate}</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[10px] uppercase">Status</div>
                  <div className="text-amber-400 font-semibold mt-0.5 truncate">{det.status}</div>
                </div>
              </div>

              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-lg text-xs text-neutral-300 space-y-1">
                <div className="font-semibold text-neutral-200">AI visual evidence:</div>
                <p className="text-[11px] leading-relaxed text-neutral-400">{det.candidateNotes}</p>
              </div>

              <div className="text-[11px] font-mono text-neutral-500 flex items-center justify-between">
                <span>Center: {det.lat.toFixed(4)}° N, {det.lng.toFixed(4)}° E</span>
                <span>Bounds: [{det.bounds.south}, {det.bounds.west}]</span>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-xs text-neutral-500">Requires Ground Truth Inspection</span>
              <span className="text-xs text-amber-300">Field verification required</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
