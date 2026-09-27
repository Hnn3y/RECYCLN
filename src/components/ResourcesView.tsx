import React, { useState } from 'react';
import type { Resource, ResourcePassport, User, Organization } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  Plus,
  Camera,
  QrCode,
  FileText,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Shield,
  X,
} from 'lucide-react';

interface ResourcesViewProps {
  resources: Resource[];
  currentUser: User | null;
  currentOrg: Organization | null;
  onRefresh: () => void;
  onOpenScanner: () => void;
  onOpenCreateListing: (resource: Resource) => void;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  resources,
  currentUser,
  currentOrg,
  onRefresh,
  onOpenScanner,
  onOpenCreateListing,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPassport, setSelectedPassport] = useState<{ passport: ResourcePassport; resource: Resource } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoadingPassport, setIsLoadingPassport] = useState(false);

  // Form states for manual resource creation
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Non-Ferrous Metals');
  const [formMaterial, setFormMaterial] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState<'tonnes' | 'kg' | 'units' | 'm³'>('tonnes');
  const [formCondition, setFormCondition] = useState<'EXCELLENT' | 'GOOD' | 'FAIR' | 'REFURBISHABLE' | 'SCRAP'>('GOOD');
  const [formValue, setFormValue] = useState('');
  const [formOrigin, setFormOrigin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'ALL',
    'Non-Ferrous Metals',
    'Ferrous Metals',
    'Plastics & Polymers',
    'High-Value Electrical Scrap',
    'Construction Materials',
  ];

  const filteredResources = resources.filter((res) => {
    const matchesCat = selectedCategory === 'ALL' || res.category === selectedCategory;
    const matchesSearch =
      res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.materialType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.locationName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenPassport = async (resource: Resource) => {
    setIsLoadingPassport(true);
    try {
      const data = await api.getResourcePassport(resource.id);
      setSelectedPassport({ passport: data.passport, resource });
    } catch (e) {
      console.error('Failed to load passport:', e);
    } finally {
      setIsLoadingPassport(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !formName || !formQuantity || !formMaterial) return;

    setIsSubmitting(true);
    try {
      await api.createResource({
        orgId: currentOrg.id,
        name: formName,
        category: formCategory,
        materialType: formMaterial,
        quantity: Number(formQuantity),
        unit: formUnit,
        condition: formCondition,
        estimatedValue: Number(formValue) || 1000,
        currency: 'USD',
        origin: formOrigin || 'Decommissioned facility salvage',
        locationName: currentOrg.address,
        lat: currentOrg.lat,
        lng: currentOrg.lng,
        actorId: currentUser?.id,
        actorName: currentUser?.name,
        actorRole: currentUser?.role,
      });
      setShowCreateModal(false);
      setFormName('');
      setFormMaterial('');
      setFormQuantity('');
      setFormValue('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Physical Resource Inventory & Passports
          </h1>
          <div className="text-xs text-neutral-400 mt-1">
            Registered industrial materials, digital circularity identities, and verifiable custody ledgers
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800 rounded-lg transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>AI Resource Scanner</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Resource</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search material type, alloy grade, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((res) => (
          <div
            key={res.id}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-all group"
          >
            <div>
              {/* Clean Unboxed Metadata Line (Zero-Pill compliant) */}
              <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                <span className="text-emerald-400 font-medium">{res.category}</span>
                <span aria-hidden="true">·</span>
                <span>{res.condition} Condition</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-neutral-400">{res.status}</span>
              </div>

              <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                {res.name}
              </h3>
              <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                {res.description || 'Verified industrial stock with full chemical composition assay.'}
              </p>

              {/* Metric Row with Tabular Figures */}
              <div className="mt-4 pt-3 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-neutral-500 text-[11px]">Quantity Available</div>
                  <div className="font-mono font-semibold text-white tabular-nums text-sm">
                    {res.quantity} {res.unit}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[11px]">Estimated Value</div>
                  <div className="font-mono font-semibold text-emerald-400 tabular-nums text-sm">
                    ${res.estimatedValue.toLocaleString()} {res.currency}
                  </div>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-neutral-500 flex items-center gap-1.5 truncate">
                <span className="truncate">📍 {res.locationName}</span>
              </div>
            </div>

            {/* Card Action Footers */}
            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
              <button
                onClick={() => handleOpenPassport(res)}
                className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-emerald-400 transition-colors font-medium cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resource Passport</span>
              </button>

              <button
                onClick={() => onOpenCreateListing(res)}
                className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
              >
                <span>Create Listing</span>
                <ArrowUpRight className="w-3 h-3 text-neutral-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-16 bg-neutral-900/50 border border-dashed border-neutral-800 rounded-xl">
          <Layers className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-neutral-300">No resources found</h3>
          <p className="text-xs text-neutral-500 mt-1">Try adjusting your category filter or search query.</p>
        </div>
      )}

      {/* Resource Passport Inspector Modal */}
      {selectedPassport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                  <Shield className="w-4 h-4" />
                  <span>W3C VERIFIABLE CREDENTIAL · ISO 14021</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1 font-display">
                  Digital Resource Passport
                </h2>
                <div className="text-xs text-neutral-400 mt-0.5">
                  Batch: {selectedPassport.passport.batchCode}
                </div>
              </div>
              <button
                onClick={() => setSelectedPassport(null)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Passport Identity Header */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-neutral-500">Material Purity</div>
                <div className="font-mono text-base font-semibold text-white tabular-nums">
                  {selectedPassport.passport.materialPurity}%
                </div>
              </div>
              <div>
                <div className="text-neutral-500">Circularity Score</div>
                <div className="font-mono text-base font-semibold text-emerald-400 tabular-nums">
                  {selectedPassport.passport.circularityScore}/100
                </div>
              </div>
              <div>
                <div className="text-neutral-500">CO2e Avoided</div>
                <div className="font-mono text-base font-semibold text-emerald-400 tabular-nums">
                  {(selectedPassport.passport.carbonOffsetKg / 1000).toFixed(1)}t
                </div>
              </div>
              <div>
                <div className="text-neutral-500">Recovery Pathway</div>
                <div className="font-semibold text-blue-400 truncate">
                  {selectedPassport.passport.recommendedRecoveryPathway}
                </div>
              </div>
            </div>

            {/* Cryptographic Fingerprint */}
            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-lg text-xs space-y-1">
              <div className="text-neutral-500 font-medium">Digital Hash & Chain of Custody Proof:</div>
              <div className="font-mono text-[11px] text-neutral-300 break-all">
                {selectedPassport.passport.digitalFingerprint}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Provenance Origin: {selectedPassport.passport.provenance}
              </div>
            </div>

            {/* QR Code Graphic Simulation */}
            <div className="flex items-center gap-4 p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="w-20 h-20 bg-white p-2 rounded-lg flex items-center justify-center shrink-0">
                <QrCode className="w-16 h-16 text-neutral-900" />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-semibold text-white">Physical QR Asset Tagging ID</div>
                <div className="font-mono text-emerald-400 text-xs">{selectedPassport.resource.qrCodeId}</div>
                <p className="text-neutral-400 text-[11px]">
                  Affix this QR code to the material packaging or shipping crate. Scanning redirects verified customs, weighbridge, and logistics operators to this live immutable ledger.
                </p>
              </div>
            </div>

            {/* Historical Custody Event Log */}
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Event History & Lab Assays
              </h4>
              <div className="space-y-2 border-l-2 border-neutral-800 pl-4 ml-2">
                {selectedPassport.passport.history.map((evt) => (
                  <div key={evt.id} className="relative text-xs space-y-0.5">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-neutral-900" />
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{evt.eventType}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-neutral-300">{evt.notes}</div>
                    <div className="text-[11px] text-neutral-500">
                      Officer: {evt.actorName} · {evt.actorOrg} · {evt.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <button
                onClick={() => setSelectedPassport(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Close Passport
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Registration Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateResource}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-display">Register New Resource Batch</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Resource Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15 Tonnes Decommissioned Copper Windings"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Non-Ferrous Metals">Non-Ferrous Metals</option>
                    <option value="Ferrous Metals">Ferrous Metals</option>
                    <option value="Plastics & Polymers">Plastics & Polymers</option>
                    <option value="High-Value Electrical Scrap">High-Value Electrical Scrap</option>
                    <option value="Construction Materials">Construction Materials</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Material Specification</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aluminium 6063 or Cu-ETP"
                    value={formMaterial}
                    onChange={(e) => setFormMaterial(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="10.5"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Unit</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="tonnes">tonnes</option>
                    <option value="kg">kg</option>
                    <option value="units">units</option>
                    <option value="m³">m³</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Condition</label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="EXCELLENT">EXCELLENT</option>
                    <option value="GOOD">GOOD</option>
                    <option value="FAIR">FAIR</option>
                    <option value="REFURBISHABLE">REFURBISHABLE</option>
                    <option value="SCRAP">SCRAP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Estimated Total Value (USD)</label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Provenance / Origin</label>
                  <input
                    type="text"
                    placeholder="Decommissioned sub-station"
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-neutral-950 rounded-lg cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Registering...' : 'Provision Digital Passport'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
