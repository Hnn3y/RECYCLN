import React, { useState } from 'react';
import type { Facility, CapacityReservation, User, Organization } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  Factory,
  Calendar,
  CheckCircle2,
  Plus,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  X,
} from 'lucide-react';

interface FacilitiesViewProps {
  facilities: Facility[];
  reservations: CapacityReservation[];
  currentUser: User | null;
  currentOrg: Organization | null;
  onRefresh: () => void;
}

export const FacilitiesView: React.FC<FacilitiesViewProps> = ({
  facilities,
  reservations,
  currentUser,
  currentOrg,
  onRefresh,
}) => {
  const [selectedFacilityForBooking, setSelectedFacilityForBooking] = useState<Facility | null>(null);
  const [bookingTonnes, setBookingTonnes] = useState('50');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityForBooking || !currentOrg) return;

    setIsSubmitting(true);
    try {
      await api.reserveCapacity({
        facilityId: selectedFacilityForBooking.id,
        reservingOrgId: currentOrg.id,
        reservedTonnes: Number(bookingTonnes),
        startDate,
        endDate,
        actorName: currentUser?.name || 'Procurement Rep',
      });
      setSelectedFacilityForBooking(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Capacity reservation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Facility Directory & Capacity Marketplace
          </h1>
          <div className="text-xs text-neutral-400 mt-1">
            Induction smelters, MRF sorting plants, twin-screw extruders & guaranteed capacity allocations
          </div>
        </div>

        <div className="text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Double-Booking Prevention Enabled</span>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facilities.map((fac) => {
          const occupancyPct = Math.round(
            ((fac.totalCapacityTonnesPerMonth - fac.availableCapacityTonnesPerMonth) /
              fac.totalCapacityTonnesPerMonth) *
              100
          );

          return (
            <div
              key={fac.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-blue-400">
                      {fac.facilityType.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-semibold text-white mt-0.5">{fac.name}</h3>
                    <div className="text-xs text-neutral-400">📍 {fac.address}, {fac.city}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                      {fac.availableCapacityTonnesPerMonth} t/mo
                    </div>
                    <div className="text-[11px] text-neutral-500">Available Capacity</div>
                  </div>
                </div>

                {/* Capacity Occupancy Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Processing Utilization</span>
                    <span className="font-mono tabular-nums">{occupancyPct}% utilized</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                </div>

                {/* Accepted Materials List (Clean unboxed tags) */}
                <div>
                  <div className="text-[11px] text-neutral-500 mb-1">Accepted Material Streams:</div>
                  <div className="flex flex-wrap gap-1.5 text-xs text-neutral-300">
                    {fac.acceptedMaterials.map((mat, i) => (
                      <span key={i} className="text-xs text-neutral-300">
                        {mat}
                        {i < fac.acceptedMaterials.length - 1 && <span className="text-neutral-600 ml-1.5">·</span>}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-1 text-neutral-400">
                  <div className="text-[11px]">Shift: {fac.operatingHours}</div>
                  <div className="text-[11px] text-emerald-400">Certification: {fac.certificationStatus}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-500">Contact: {fac.contactEmail}</span>
                <button
                  onClick={() => setSelectedFacilityForBooking(fac)}
                  className="px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Book Capacity
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Capacity Reservations Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <h3 className="text-base font-semibold text-white font-display">Active Capacity Allocation Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="text-[11px] uppercase text-neutral-500 border-b border-neutral-800 pb-2">
              <tr>
                <th className="pb-2">Facility</th>
                <th className="pb-2">Reserving Organization</th>
                <th className="pb-2 text-right">Allocated Volume</th>
                <th className="pb-2">Time Window</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {reservations.map((res) => (
                <tr key={res.id} className="hover:bg-neutral-800/30">
                  <td className="py-2.5 font-sans font-medium text-white">{res.facilityName}</td>
                  <td className="py-2.5 font-sans text-neutral-300">{res.reservingOrgName}</td>
                  <td className="py-2.5 text-right font-semibold text-emerald-400 tabular-nums">
                    {res.reservedTonnes} tonnes
                  </td>
                  <td className="py-2.5 text-neutral-400 tabular-nums">
                    {res.startDate} → {res.endDate}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {res.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedFacilityForBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleReserve}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Reserve Processing Capacity</h3>
                <div className="text-xs text-neutral-400 mt-0.5">{selectedFacilityForBooking.name}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFacilityForBooking(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-1">
              <div className="flex justify-between text-neutral-400">
                <span>Available Open Capacity</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {selectedFacilityForBooking.availableCapacityTonnesPerMonth} tonnes/month
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Reserving Organization</span>
                <span className="text-white">{currentOrg?.name}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Requested Capacity (Tonnes)</label>
                <input
                  type="number"
                  step="5"
                  required
                  max={selectedFacilityForBooking.availableCapacityTonnesPerMonth}
                  value={bookingTonnes}
                  onChange={(e) => setBookingTonnes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setSelectedFacilityForBooking(null)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold bg-blue-500 hover:bg-blue-400 text-white rounded-lg cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Confirming Lock...' : 'Lock Capacity Reservation'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
