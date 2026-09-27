import React, { useState, useEffect } from 'react';
import type { Listing, WantedRequest, MatchScore, User, Organization, Resource } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  Sparkles,
  Search,
  Plus,
  Repeat,
  DollarSign,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle,
  Calculator,
  ShieldCheck,
  X,
} from 'lucide-react';

interface MarketplaceViewProps {
  listings: Listing[];
  wantedRequests: WantedRequest[];
  resources: Resource[];
  currentUser: User | null;
  currentOrg: Organization | null;
  onRefresh: () => void;
  onOpenTransactionTab: () => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  listings,
  wantedRequests,
  resources,
  currentUser,
  currentOrg,
  onRefresh,
  onOpenTransactionTab,
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'wanted' | 'matching' | 'valuation'>('listings');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // AI Matching Engine state
  const [selectedWantedId, setSelectedWantedId] = useState<string>(wantedRequests[0]?.id || '');
  const [matches, setMatches] = useState<MatchScore[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Valuation Tool state
  const [valCategory, setValCategory] = useState('Non-Ferrous Metals');
  const [valMaterial, setValMaterial] = useState('Aluminium 6063');
  const [valQuantity, setValQuantity] = useState('12.5');
  const [valCondition, setValCondition] = useState('GOOD');
  const [valDistance, setValDistance] = useState('35');
  const [valuationResult, setValuationResult] = useState<any>(null);

  // Offer Modal State
  const [offerListing, setOfferListing] = useState<Listing | null>(null);
  const [offerQuantity, setOfferQuantity] = useState<string>('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  // Create Wanted Request State
  const [showCreateWanted, setShowCreateWanted] = useState(false);
  const [wantedMaterial, setWantedMaterial] = useState('');
  const [wantedQuantity, setWantedQuantity] = useState('');
  const [wantedMaxDist, setWantedMaxDist] = useState('50');
  const [wantedMaxPrice, setWantedMaxPrice] = useState('');

  // Fetch matches when selected Wanted Request changes
  useEffect(() => {
    if (selectedWantedId) {
      loadMatches(selectedWantedId);
    }
  }, [selectedWantedId]);

  const loadMatches = async (wantedId: string) => {
    setIsLoadingMatches(true);
    try {
      const res = await api.getMatches(wantedId);
      setMatches(res);
    } catch (e) {
      console.error('Failed to load matches:', e);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleComputeValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.getValuation({
        category: valCategory,
        materialType: valMaterial,
        quantityTonnes: Number(valQuantity),
        condition: valCondition,
        distanceKm: Number(valDistance),
      });
      setValuationResult(res);
    } catch (e) {
      console.error('Valuation calculation failed:', e);
    }
  };

  const handleOpenOfferModal = (listing: Listing) => {
    setOfferListing(listing);
    setOfferQuantity(String(listing.quantity));
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerListing || !currentOrg) return;

    setIsSubmittingOffer(true);
    try {
      await api.createOffer({
        listingId: offerListing.id,
        buyerOrgId: currentOrg.id,
        quantity: Number(offerQuantity),
        actorName: currentUser?.name || 'Buyer Rep',
      });
      setOfferListing(null);
      onRefresh();
      onOpenTransactionTab();
    } catch (err: any) {
      alert(err.message || 'Offer submission failed');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleCreateWanted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !wantedMaterial || !wantedQuantity) return;

    try {
      await api.createWantedRequest({
        orgId: currentOrg.id,
        materialType: wantedMaterial,
        desiredQuantity: Number(wantedQuantity),
        unit: 'tonnes',
        maxDistanceKm: Number(wantedMaxDist),
        targetLocation: currentOrg.address,
        targetLat: currentOrg.lat,
        targetLng: currentOrg.lng,
        maxPricePerUnit: Number(wantedMaxPrice) || 2000,
        currency: 'USD',
      });
      setShowCreateWanted(false);
      setWantedMaterial('');
      setWantedQuantity('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Creation failed');
    }
  };

  const filteredListings = listings.filter((l) => {
    if (selectedTypeFilter === 'ALL') return true;
    return l.listingType === selectedTypeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header and Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            B2B Resource Exchange & AI Matchmaker
          </h1>
          <div className="text-xs text-neutral-400 mt-1">
            Multilateral circular trading: Buy · Sell · Exchange · Reallocate · Donate
          </div>
        </div>

        {/* Tab Controls (Zero-Pill compliant) */}
        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'listings' ? 'bg-neutral-800 text-emerald-400 shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Marketplace ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('wanted')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'wanted' ? 'bg-neutral-800 text-emerald-400 shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Wanted Requests ({wantedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('matching')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'matching' ? 'bg-neutral-800 text-emerald-400 shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Match Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('valuation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'valuation' ? 'bg-neutral-800 text-emerald-400 shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>AI Valuation</span>
          </button>
        </div>
      </div>

      {/* 1. LISTINGS TAB */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {/* Sub-Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
              {['ALL', 'SELL', 'EXCHANGE', 'REALLOCATE', 'DONATE'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedTypeFilter === type
                      ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="text-xs text-neutral-500 hidden sm:block">
              All transactions backed by Escrow Verification
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                    <span className="text-emerald-400 font-semibold">{listing.listingType}</span>
                    <span>{listing.category}</span>
                  </div>

                  <h3 className="text-base font-semibold text-white leading-snug">
                    {listing.title}
                  </h3>

                  <div className="mt-1 text-xs text-neutral-400 line-clamp-2">
                    {listing.terms}
                  </div>

                  {listing.exchangeWantedMaterial && (
                    <div className="mt-2 p-2 bg-neutral-950 border border-neutral-800 rounded-md text-[11px] text-blue-300">
                      <span className="font-semibold text-blue-400">Exchange Wish: </span>
                      {listing.exchangeWantedMaterial}
                    </div>
                  )}

                  {/* Financial Metrics Row */}
                  <div className="mt-4 pt-3 border-t border-neutral-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-neutral-500 text-[11px]">Unit Price</div>
                      <div className="font-mono font-semibold text-emerald-400 tabular-nums text-sm">
                        ${listing.pricePerUnit} / {listing.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-500 text-[11px]">Lot Volume</div>
                      <div className="font-mono font-semibold text-white tabular-nums text-sm">
                        {listing.quantity} {listing.unit}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-neutral-500 flex items-center justify-between">
                    <span>📍 {listing.locationName}</span>
                    <span>Seller: {listing.orgName}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                  <span className="text-xs text-neutral-500">
                    Min Order: {listing.minimumOrderQuantity} {listing.unit}
                  </span>
                  <button
                    onClick={() => handleOpenOfferModal(listing)}
                    className="px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                  >
                    Submit Offer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. WANTED REQUESTS TAB */}
      {activeTab === 'wanted' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
            <div>
              <h2 className="text-sm font-semibold text-white">Buyer Wanted Sourcing Requests</h2>
              <div className="text-xs text-neutral-400">
                Organizations seeking specific material streams within defined transport radiuses
              </div>
            </div>
            <button
              onClick={() => setShowCreateWanted(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Wanted Request</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wantedRequests.map((req) => (
              <div
                key={req.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-emerald-400">
                      WANTED STREAM · {req.status}
                    </span>
                    <h3 className="text-base font-semibold text-white mt-0.5">{req.materialType}</h3>
                    <div className="text-xs text-neutral-400">Buyer: {req.orgName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-base font-semibold text-white tabular-nums">
                      {req.desiredQuantity} {req.unit}
                    </div>
                    <div className="text-[11px] text-neutral-500">Target Volume</div>
                  </div>
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-neutral-500 text-[11px]">Max Radius</div>
                    <div className="font-mono text-neutral-200 tabular-nums">{req.maxDistanceKm} km</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-[11px]">Target Price</div>
                    <div className="font-mono text-emerald-400 tabular-nums">
                      ${req.maxPricePerUnit} / {req.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-[11px]">Deadline</div>
                    <div className="font-mono text-neutral-400 tabular-nums">{req.deadline}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-neutral-500">Destination: {req.targetLocation}</span>
                  <button
                    onClick={() => {
                      setSelectedWantedId(req.id);
                      setActiveTab('matching');
                    }}
                    className="text-emerald-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Run AI Matcher</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. AI MATCHING ENGINE TAB */}
      {activeTab === 'matching' && (
        <div className="space-y-4">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase font-mono">
                <Sparkles className="w-4 h-4" />
                <span>Explainable AI Match Engine</span>
              </div>
              <h2 className="text-base font-semibold text-white mt-0.5">
                Supply & Demand Attribute Alignment
              </h2>
              <div className="text-xs text-neutral-400">
                Matches buyer requirements against material purity, PostGIS route distance, and haulage capacity
              </div>
            </div>

            {/* Wanted Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-400 whitespace-nowrap">Evaluate against:</span>
              <select
                value={selectedWantedId}
                onChange={(e) => setSelectedWantedId(e.target.value)}
                className="px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-md text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                {wantedRequests.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.orgName} — {w.desiredQuantity}t {w.materialType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Match Results List */}
          <div className="space-y-3">
            {isLoadingMatches ? (
              <div className="text-center py-12 text-xs text-neutral-400">
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Computing spatial compatibility matrix & material purity scores...
              </div>
            ) : matches.length > 0 ? (
              matches.map((match) => (
                <div
                  key={match.listingId}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3 hover:border-neutral-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-white">{match.listing.title}</h3>
                      <div className="text-xs text-neutral-400">
                        Seller: {match.listing.orgName} · Location: {match.listing.locationName}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                          {match.compatibilityScore}%
                        </div>
                        <div className="text-[10px] text-neutral-500 uppercase">Match Score</div>
                      </div>
                      <button
                        onClick={() => handleOpenOfferModal(match.listing)}
                        className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Initiate Trade
                      </button>
                    </div>
                  </div>

                  {/* Transparent Explanation Box (Prompt requirement: Never expose an unexplained AI score) */}
                  <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-lg text-xs space-y-1">
                    <div className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Match Reason & Scoring Audit:</span>
                    </div>
                    <div className="text-neutral-300 text-[11px] leading-relaxed">
                      {match.explanation}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-neutral-900/50 border border-dashed border-neutral-800 rounded-xl text-xs text-neutral-500">
                No compatible matches found for this request within current distance limits.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. AI VALUATION CALCULATOR TAB */}
      {activeTab === 'valuation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={handleComputeValuation}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4"
          >
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>AI Material Valuation Engine</span>
              </h2>
              <div className="text-xs text-neutral-400 mt-0.5">
                Estimates gross market value, transport deductions, and net recovery yield
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Category</label>
                <select
                  value={valCategory}
                  onChange={(e) => setValCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                >
                  <option value="Non-Ferrous Metals">Non-Ferrous Metals</option>
                  <option value="Ferrous Metals">Ferrous Metals</option>
                  <option value="Plastics & Polymers">Plastics & Polymers</option>
                  <option value="High-Value Electrical Scrap">High-Value Electrical Scrap</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Material Specification</label>
                <input
                  type="text"
                  value={valMaterial}
                  onChange={(e) => setValMaterial(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-neutral-400 mb-1">Tonnes</label>
                  <input
                    type="number"
                    step="0.5"
                    value={valQuantity}
                    onChange={(e) => setValQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Condition</label>
                  <select
                    value={valCondition}
                    onChange={(e) => setValCondition(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  >
                    <option value="EXCELLENT">EXCELLENT</option>
                    <option value="GOOD">GOOD</option>
                    <option value="FAIR">FAIR</option>
                    <option value="REFURBISHABLE">REFURBISHABLE</option>
                    <option value="SCRAP">SCRAP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Distance (km)</label>
                  <input
                    type="number"
                    value={valDistance}
                    onChange={(e) => setValDistance(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Calculate Valuation Breakdown
            </button>
          </form>

          {/* Valuation Result Panel */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Estimated Valuation Breakdown</h3>
              <div className="text-xs text-neutral-400 mt-0.5">
                Benchmark based on current scrap commodity indices
              </div>

              {valuationResult ? (
                <div className="mt-4 space-y-3 text-xs">
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                    <div className="flex justify-between text-neutral-400">
                      <span>Base Material Benchmark Rate</span>
                      <span className="font-mono text-white tabular-nums">
                        ${valuationResult.baseRatePerTonne} / tonne
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Condition Multiplier ({valCondition})</span>
                      <span className="font-mono text-white tabular-nums">
                        {(valuationResult.conditionMultiplier * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Gross Market Value</span>
                      <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                        ${valuationResult.grossMarketValue.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                    <div className="flex justify-between text-neutral-400">
                      <span>Est. Haulage & Transit ({valDistance} km)</span>
                      <span className="font-mono text-red-400 tabular-nums">
                        -${valuationResult.estimatedTransportCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Smelting / Sorting Overhead</span>
                      <span className="font-mono text-red-400 tabular-nums">
                        -${valuationResult.estimatedProcessingFee.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-emerald-400 font-medium">Estimated Net Recovery Value</div>
                      <div className="text-2xl font-bold font-mono text-white tabular-nums">
                        ${valuationResult.estimatedNetRecoveryValue.toLocaleString()} USD
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-neutral-500">
                  Enter material specifications and submit to compute algorithmic valuation.
                </div>
              )}
            </div>

            {/* Mandatory Non-Guaranteed Disclaimer */}
            <div className="text-[11px] text-neutral-500 border-t border-neutral-800 pt-3">
              ⚠️ <span className="font-medium">Estimated value — not guaranteed market price.</span> Final transaction settlements depend on weighbridge verification, XRF lab assay, and physical acceptance.
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {offerListing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitOffer}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Submit Transaction Offer</h3>
                <div className="text-xs text-neutral-400 mt-0.5">{offerListing.title}</div>
              </div>
              <button
                type="button"
                onClick={() => setOfferListing(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-1">
              <div className="flex justify-between text-neutral-400">
                <span>Unit Price</span>
                <span className="font-mono text-emerald-400 font-medium">
                  ${offerListing.pricePerUnit} / {offerListing.unit}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Seller</span>
                <span className="text-neutral-200">{offerListing.orgName}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Buyer Account</span>
                <span className="text-neutral-200">{currentOrg?.name}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block text-neutral-400">Offer Volume ({offerListing.unit})</label>
              <input
                type="number"
                step="0.1"
                required
                max={offerListing.quantity}
                value={offerQuantity}
                onChange={(e) => setOfferQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
              <div className="text-[11px] text-neutral-500">
                Total Transaction Value:{' '}
                <span className="font-mono text-white font-semibold">
                  ${(Number(offerQuantity) * offerListing.pricePerUnit || 0).toLocaleString()} USD
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setOfferListing(null)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingOffer}
                className="px-4 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-neutral-950 rounded-lg cursor-pointer disabled:opacity-50"
              >
                {isSubmittingOffer ? 'Submitting...' : 'Commit Offer to Escrow'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Wanted Request Modal */}
      {showCreateWanted && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateWanted}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-display">Broadcast Wanted Material Request</h3>
              <button
                type="button"
                onClick={() => setShowCreateWanted(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Target Material Stream</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clean rPET Bales or S275 Structural Steel"
                  value={wantedMaterial}
                  onChange={(e) => setWantedMaterial(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Desired Quantity (Tonnes)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="25.0"
                    value={wantedQuantity}
                    onChange={(e) => setWantedQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Max Transport Radius (km)</label>
                  <input
                    type="number"
                    value={wantedMaxDist}
                    onChange={(e) => setWantedMaxDist(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Maximum Price Per Unit (USD)</label>
                <input
                  type="number"
                  placeholder="2100"
                  value={wantedMaxPrice}
                  onChange={(e) => setWantedMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowCreateWanted(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-neutral-950 rounded-lg cursor-pointer"
              >
                Broadcast to Network
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
