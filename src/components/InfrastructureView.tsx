import React, { useState } from 'react';
import type { InfrastructureReport, User, Organization } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  AlertTriangle,
  Plus,
  ShieldCheck,
  CheckCircle,
  MapPin,
  Clock,
  Send,
  Building,
} from 'lucide-react';

interface InfrastructureViewProps {
  reports: InfrastructureReport[];
  currentUser: User | null;
  currentOrg: Organization | null;
  onRefresh: () => void;
}

export const InfrastructureView: React.FC<InfrastructureViewProps> = ({
  reports,
  currentUser,
  currentOrg,
  onRefresh,
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [triageReport, setTriageReport] = useState<InfrastructureReport | null>(null);

  // New Report Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'ROAD_DAMAGE' | 'ILLEGAL_DUMPSITE' | 'DRAINAGE_BLOCKAGE' | 'BROKEN_LIGHTING' | 'WATER_INFRASTRUCTURE' | 'HAZARDOUS_ACCUMULATION'>('DRAINAGE_BLOCKAGE');
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Triage Form
  const [triageDept, setTriageDept] = useState('Emergency Drainage Clearance Unit');
  const [triageStatus, setTriageStatus] = useState<'VERIFIED' | 'ASSIGNED' | 'RESOLVED'>('VERIFIED');
  const [isTriaging, setIsTriaging] = useState(false);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setIsSubmitting(true);
    try {
      await api.createInfrastructureReport({
        reporterUserId: currentUser?.id,
        reporterName: currentUser?.name || 'Citizen / Field Inspector',
        reporterOrgName: currentOrg?.name || 'Municipal Works',
        title,
        category,
        severity,
        description,
        locationName: locationName || 'Ikeja Municipal Corridor',
        lat: currentOrg?.lat || 6.6018,
        lng: currentOrg?.lng || 3.3515,
      });
      setShowReportModal(false);
      setTitle('');
      setDescription('');
      setLocationName('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Report creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triageReport) return;

    setIsTriaging(true);
    try {
      await api.triageReport(triageReport.id, {
        status: triageStatus,
        assignedDepartment: triageDept,
        verifiedBy: currentUser?.name || 'Authorized Supervisor',
      });
      setTriageReport(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Triage update failed');
    } finally {
      setIsTriaging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Infrastructure Intelligence & Civic Triage
          </h1>
          <div className="text-xs text-neutral-400 mt-1">
            Monitoring damaged roads, drainage blockages, illegal dumpsites & water infrastructure
          </div>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Infrastructure Incident</span>
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((rep) => {
          let severityColor = 'text-neutral-400';
          if (rep.severity === 'CRITICAL') severityColor = 'text-red-400 font-semibold';
          else if (rep.severity === 'HIGH') severityColor = 'text-amber-400 font-semibold';
          else if (rep.severity === 'MEDIUM') severityColor = 'text-yellow-400';

          return (
            <div
              key={rep.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-neutral-400">
                      {rep.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-semibold text-white leading-snug">{rep.title}</h3>
                  </div>
                  <span className={`text-xs font-mono tabular-nums ${severityColor}`}>{rep.severity}</span>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                  {rep.description}
                </p>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-1 text-neutral-400">
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span className="font-mono text-white">{rep.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Department</span>
                    <span className="text-neutral-200 truncate max-w-[160px]">
                      {rep.assignedDepartment || 'Pending Assignment'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Human Verified</span>
                    <span className={rep.humanVerified ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                      {rep.humanVerified ? `✓ Verified by ${rep.verifiedBy}` : 'Pending Ground Check'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-500">
                  📍 {rep.locationName} · Reported by {rep.reporterName}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-500">
                  {new Date(rep.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setTriageReport(rep)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
                >
                  Triage & Assign
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Incident Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateReport}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-display">Log Infrastructure Incident</h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Incident Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Major Canal Blocked by Discarded Tyres & Plastics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  >
                    <option value="DRAINAGE_BLOCKAGE">Drainage Blockage</option>
                    <option value="ILLEGAL_DUMPSITE">Illegal Dumpsite</option>
                    <option value="ROAD_DAMAGE">Road Damage / Crater</option>
                    <option value="BROKEN_LIGHTING">Broken Lighting</option>
                    <option value="WATER_INFRASTRUCTURE">Water Infrastructure</option>
                    <option value="HAZARDOUS_ACCUMULATION">Hazardous Accumulation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Detailed Site Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe location landmarks, obstruction size, environmental risk..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Location Landmarks</label>
                <input
                  type="text"
                  placeholder="e.g. Under Mile 12 Flyover, Ikorodu Expressway"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Logging...' : 'Submit Incident Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Human Triage & Assignment Modal */}
      {triageReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleTriageSubmit}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Triage & Department Assignment</h3>
                <div className="text-xs text-neutral-400 mt-0.5">{triageReport.title}</div>
              </div>
              <button
                type="button"
                onClick={() => setTriageReport(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Assigned Department</label>
                <input
                  type="text"
                  required
                  value={triageDept}
                  onChange={(e) => setTriageDept(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Resolution Status</label>
                <select
                  value={triageStatus}
                  onChange={(e) => setTriageStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                >
                  <option value="VERIFIED">VERIFIED (Ground-truth confirmed)</option>
                  <option value="ASSIGNED">ASSIGNED (Work order dispatched)</option>
                  <option value="RESOLVED">RESOLVED (Debris cleared)</option>
                </select>
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-[11px] text-neutral-400">
                🛡️ <span className="font-semibold text-emerald-400">Human Governance Rule:</span> Automated algorithms may propose department routing, but final assignment and work dispatch require authorized officer sign-off.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setTriageReport(null)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isTriaging}
                className="px-4 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-neutral-950 rounded-lg cursor-pointer"
              >
                {isTriaging ? 'Saving...' : 'Update Triage Record'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
