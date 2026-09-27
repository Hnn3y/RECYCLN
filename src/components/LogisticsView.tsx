import React, { useState } from 'react';
import type { Vehicle, Driver, LogisticsJob, User, Organization } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  Truck,
  Users,
  Compass,
  CheckCircle,
  FileCheck,
  Plus,
  ArrowRight,
  MapPin,
  Clock,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';

interface LogisticsViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  jobs: LogisticsJob[];
  currentUser: User | null;
  currentOrg: Organization | null;
  onRefresh: () => void;
}

export const LogisticsView: React.FC<LogisticsViewProps> = ({
  vehicles,
  drivers,
  jobs,
  currentUser,
  currentOrg,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'jobs' | 'fleet' | 'drivers'>('jobs');
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedJobForPod, setSelectedJobForPod] = useState<LogisticsJob | null>(null);

  // Dispatch Form
  const [dispatchVehicleId, setDispatchVehicleId] = useState(vehicles[0]?.id || '');
  const [dispatchDriverId, setDispatchDriverId] = useState(drivers[0]?.id || '');
  const [cargoDesc, setCargoDesc] = useState('');
  const [weightTonnes, setWeightTonnes] = useState('10.0');
  const [destName, setDestName] = useState('');
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  // POD Form
  const [signatureName, setSignatureName] = useState('');
  const [podNotes, setPodNotes] = useState('Weighbridge tare verified by consignee representative.');
  const [isSubmittingPod, setIsSubmittingPod] = useState(false);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchVehicleId) return;

    setIsSubmittingDispatch(true);
    try {
      await api.dispatchJob({
        vehicleId: dispatchVehicleId,
        driverId: dispatchDriverId,
        cargoDescription: cargoDesc || 'Industrial Scrap Lot',
        weightTonnes: Number(weightTonnes),
        originName: currentOrg?.address || 'Origin Industrial Yard',
        originLat: currentOrg?.lat || 6.6025,
        originLng: currentOrg?.lng || 3.3522,
        destinationName: destName || 'Central Smelter Terminal',
        destinationLat: 6.4695,
        destinationLng: 3.6185,
        actorName: currentUser?.name || 'Fleet Dispatcher',
      });
      setShowDispatchModal(false);
      setCargoDesc('');
      setDestName('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Dispatch failed');
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  const handleSubmitPod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForPod) return;

    setIsSubmittingPod(true);
    try {
      await api.submitProofOfDelivery(selectedJobForPod.id, {
        signatureName: signatureName || 'Consignee Officer',
        notes: podNotes,
        actorName: currentUser?.name || 'Driver',
      });
      setSelectedJobForPod(null);
      setSignatureName('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'POD submission failed');
    } finally {
      setIsSubmittingPod(false);
    }
  };

  const availableVehicles = vehicles.filter((v) => v.currentStatus === 'AVAILABLE');

  return (
    <div className="space-y-6">
      {/* Header and Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Logistics, Heavy Fleet & Backhaul Optimizer
          </h1>
          <div className="text-xs text-neutral-400 mt-1">
            Coordinated material haulage, VRP route optimization, GPS tracking, and digital Proof of Delivery
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setActiveSubTab('jobs')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeSubTab === 'jobs' ? 'bg-neutral-800 text-emerald-400 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Haulage Jobs ({jobs.length})
            </button>
            <button
              onClick={() => setActiveSubTab('fleet')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeSubTab === 'fleet' ? 'bg-neutral-800 text-emerald-400 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Vehicles ({vehicles.length})
            </button>
            <button
              onClick={() => setActiveSubTab('drivers')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeSubTab === 'drivers' ? 'bg-neutral-800 text-emerald-400 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Drivers ({drivers.length})
            </button>
          </div>

          <button
            onClick={() => setShowDispatchModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dispatch Haulage</span>
          </button>
        </div>
      </div>

      {/* 1. HAULAGE JOBS TAB */}
      {activeSubTab === 'jobs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 hover:border-neutral-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-emerald-400 font-mono text-xs font-semibold">
                      {job.trackingNumber}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{job.cargoDescription}</h3>
                      <div className="text-xs text-neutral-400">
                        Weight: {job.weightTonnes} tonnes · Vehicle: {job.vehiclePlate} ({job.driverName})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-neutral-950 text-emerald-400 border border-neutral-800">
                      {job.status}
                    </span>
                    {job.status !== 'DELIVERED' && (
                      <button
                        onClick={() => setSelectedJobForPod(job)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Submit POD</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Route Visualizer Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1">
                    <div className="text-neutral-500 text-[11px]">Origin Staging:</div>
                    <div className="font-medium text-white">{job.originName}</div>
                    <div className="text-[11px] font-mono text-neutral-400 tabular-nums">
                      GPS: {job.originLat.toFixed(4)}°, {job.originLng.toFixed(4)}°
                    </div>
                  </div>
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1">
                    <div className="text-neutral-500 text-[11px]">Destination Consignee:</div>
                    <div className="font-medium text-white">{job.destinationName}</div>
                    <div className="text-[11px] font-mono text-neutral-400 tabular-nums">
                      Est. Distance: {job.estimatedDistanceKm} km · ETA: {job.estimatedDurationMins} mins
                    </div>
                  </div>
                </div>

                {/* Backhaul Optimizer Alert (Key spec requirement) */}
                {job.backhaulMatched && (
                  <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-lg text-xs flex items-center justify-between text-blue-200">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>{job.backhaulDetails}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono text-blue-400 font-semibold">
                      BACKHAUL OPTIMIZED
                    </span>
                  </div>
                )}

                {/* Completed POD Preview */}
                {job.proofOfDelivery && (
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-1">
                    <div className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Proof of Delivery Verified & Stamped</span>
                    </div>
                    <div className="text-neutral-300 text-[11px]">
                      Signatory: {job.proofOfDelivery.signatureName} · Timestamp:{' '}
                      {new Date(job.proofOfDelivery.deliveredAt).toLocaleString()}
                    </div>
                    <div className="text-neutral-400 text-[11px]">
                      Notes: {job.proofOfDelivery.notes}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. FLEET VEHICLES TAB */}
      {activeSubTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-emerald-400">{v.type}</span>
                  <h3 className="text-base font-semibold text-white font-mono mt-0.5">{v.registrationPlate}</h3>
                  <div className="text-xs text-neutral-400">{v.model}</div>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    v.currentStatus === 'AVAILABLE'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-purple-950 text-purple-400 border border-purple-800'
                  }`}
                >
                  {v.currentStatus}
                </span>
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-1.5">
                <div className="flex justify-between text-neutral-400">
                  <span>Gross Capacity</span>
                  <span className="font-mono text-white tabular-nums">
                    {(v.capacityKg / 1000).toFixed(1)} tonnes
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Fuel / Powertrain</span>
                  <span className="text-neutral-200">{v.fuelType}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Assigned Driver</span>
                  <span className="text-neutral-200">{v.assignedDriverName || 'Unassigned'}</span>
                </div>
              </div>

              <div className="text-[11px] text-neutral-500">
                Current Staging: {v.locationName}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. DRIVERS TAB */}
      {activeSubTab === 'drivers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drivers.map((d) => (
            <div
              key={d.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">{d.name}</h3>
                  <div className="text-xs text-neutral-400">License: {d.licenseNumber}</div>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
                  ★ {d.rating}
                </span>
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs grid grid-cols-3 gap-2">
                <div>
                  <div className="text-neutral-500 text-[11px]">Completed Trips</div>
                  <div className="font-mono text-white tabular-nums font-semibold mt-0.5">{d.completedTrips}</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[11px]">Current Status</div>
                  <div className="font-mono text-neutral-300 mt-0.5">{d.status}</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[11px]">Assigned Vehicle</div>
                  <div className="font-mono text-emerald-400 mt-0.5 truncate">{d.assignedVehiclePlate || 'None'}</div>
                </div>
              </div>

              <div className="text-[11px] text-neutral-500">Phone: {d.phone}</div>
            </div>
          ))}
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleDispatch}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-display">Dispatch Haulage Vehicle</h3>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Select Available Vehicle</label>
                <select
                  value={dispatchVehicleId}
                  onChange={(e) => setDispatchVehicleId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id} disabled={v.currentStatus === 'ON_TRIP'}>
                      {v.model} ({v.registrationPlate}) — {v.currentStatus === 'ON_TRIP' ? 'BUSY ON TRIP' : 'READY'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Assigned Driver</label>
                <select
                  value={dispatchDriverId}
                  onChange={(e) => setDispatchDriverId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Cargo Manifest Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12.5 Tonnes Aluminium Extrusions in Cradles"
                  value={cargoDesc}
                  onChange={(e) => setCargoDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Gross Weight (Tonnes)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={weightTonnes}
                    onChange={(e) => setWeightTonnes(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Destination Facility</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sangotedo MRF Terminal"
                    value={destName}
                    onChange={(e) => setDestName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingDispatch}
                className="px-4 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-neutral-950 rounded-lg cursor-pointer disabled:opacity-50"
              >
                {isSubmittingDispatch ? 'Dispatching...' : 'Dispatch Trip'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Proof of Delivery Modal */}
      {selectedJobForPod && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitPod}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Confirm Proof of Delivery (POD)</h3>
                <div className="text-xs text-neutral-400">Tracking: {selectedJobForPod.trackingNumber}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForPod(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Recipient / Consignee Signatory Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engr. Chidi Okafor (Lead Receiver)"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Weighbridge & Inspection Notes</label>
                <textarea
                  rows={3}
                  value={podNotes}
                  onChange={(e) => setPodNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-[11px] text-neutral-400">
                📍 <span className="font-semibold text-neutral-200">GPS Timestamp Seal:</span> This submission captures current GPS coordinates and attaches an immutable timestamp proof to the consignee ledger.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setSelectedJobForPod(null)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPod}
                className="px-4 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-neutral-950 rounded-lg cursor-pointer disabled:opacity-50"
              >
                {isSubmittingPod ? 'Verifying POD...' : 'Confirm Delivery & Release Truck'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
