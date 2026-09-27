import React, { useState } from 'react';
import { api } from '../services/api.ts';
import type { User, Organization } from '../types/index.ts';
import { Camera, Upload, Sparkles, Check, X, ShieldAlert, ArrowRight } from 'lucide-react';

interface ResourceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  currentOrg: Organization | null;
  onResourceCreated: () => void;
}

export const ResourceScannerModal: React.FC<ResourceScannerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentOrg,
  onResourceCreated,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textHint, setTextHint] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Editable draft fields
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftMaterial, setDraftMaterial] = useState('');
  const [draftQuantity, setDraftQuantity] = useState('10.0');
  const [draftCondition, setDraftCondition] = useState<'EXCELLENT' | 'GOOD' | 'FAIR' | 'REFURBISHABLE' | 'SCRAP'>('GOOD');
  const [draftValue, setDraftValue] = useState('21000');

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSampleIndustrialImage = () => {
    // High-res realistic industrial scrap sample
    setImagePreview('https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80');
    setTextHint('Industrial extruded aluminium framing deconstructed from warehouse renovation.');
    setAnalysisResult(null);
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const result = await api.scanResource(imagePreview || undefined, textHint || undefined);
      setAnalysisResult(result);
      setDraftTitle(result.detectedObject || 'Scanned Industrial Scrap');
      setDraftCategory(result.category || 'Non-Ferrous Metals');
      setDraftMaterial(result.materialType || 'Aluminium 6063');
      setDraftCondition(result.visibleCondition || 'GOOD');
      setDraftValue(String(result.estimatedValuePerUnit * 10 || 21000));
    } catch (err: any) {
      alert('Scanner error: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmDraft = async () => {
    if (!currentOrg) return;
    setIsPublishing(true);
    try {
      await api.createResource({
        orgId: currentOrg.id,
        name: draftTitle,
        category: draftCategory,
        materialType: draftMaterial,
        quantity: Number(draftQuantity),
        unit: 'tonnes',
        condition: draftCondition,
        estimatedValue: Number(draftValue),
        currency: 'USD',
        origin: 'AI Computer Vision Intake Verification',
        locationName: currentOrg.address,
        lat: currentOrg.lat,
        lng: currentOrg.lng,
        images: imagePreview ? [imagePreview] : [],
        actorId: currentUser?.id,
        actorName: currentUser?.name,
        actorRole: currentUser?.role,
      });

      onResourceCreated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm resource');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-display">AI Resource Scanner & Attribute Extractor</h2>
              <div className="text-xs text-neutral-400 mt-0.5">
                Multimodal computer vision for material classification, purity estimation & condition audit
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Phase: Upload or Take Photo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="h-56 bg-neutral-950 border-2 border-dashed border-neutral-800 rounded-xl flex flex-col items-center justify-center p-4 relative overflow-hidden group">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Scanned Resource"
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center space-y-2">
                  <Upload className="w-8 h-8 text-neutral-600 mx-auto group-hover:text-emerald-400 transition-colors" />
                  <div className="text-xs text-neutral-400">Drag & drop photo of scrap, metal stock, or machinery</div>
                  <div className="text-[11px] text-neutral-600">Supports PNG, JPG, WebP up to 20MB</div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleSampleIndustrialImage}
                className="text-emerald-400 hover:underline cursor-pointer"
              >
                Load Sample Scrap Image
              </button>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="text-neutral-500 hover:text-red-400 cursor-pointer"
                >
                  Clear Image
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 text-xs flex flex-col justify-between">
            <div className="space-y-2">
              <label className="block text-neutral-300 font-medium">Contextual Operator Hint (Optional)</label>
              <textarea
                rows={3}
                placeholder="e.g. Demolished cooling tower heat exchanger tubes, believed to be copper-nickel alloy."
                value={textHint}
                onChange={(e) => setTextHint(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-lg text-neutral-400 text-[11px] leading-relaxed">
                <span className="text-emerald-400 font-semibold">Strict Human Verification Rule:</span> The AI vision model generates a verified draft only. No marketplace listing or custody transfer can occur without explicit operator confirmation.
              </div>
            </div>

            <button
              onClick={handleRunScan}
              disabled={isScanning || (!imagePreview && !textHint)}
              className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Processing Vision Model...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Multimodal Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Phase: Structured Extraction & Operator Review Draft */}
        {analysisResult && (
          <div className="pt-4 border-t border-neutral-800 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>AI Vision Extraction Ready — Review & Confirm Draft</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">
                Confidence Purity: {analysisResult.estimatedPurityPercent}%
              </span>
            </div>

            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1">Identified Title (Editable)</label>
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-md text-white font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Material Alloy Spec</label>
                  <input
                    type="text"
                    value={draftMaterial}
                    onChange={(e) => setDraftMaterial(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-md text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1">Assessed Quantity (Tonnes)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={draftQuantity}
                    onChange={(e) => setDraftQuantity(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-md text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Visible Condition</label>
                  <select
                    value={draftCondition}
                    onChange={(e) => setDraftCondition(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-md text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="EXCELLENT">EXCELLENT</option>
                    <option value="GOOD">GOOD</option>
                    <option value="FAIR">FAIR</option>
                    <option value="REFURBISHABLE">REFURBISHABLE</option>
                    <option value="SCRAP">SCRAP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Estimated Valuation ($)</label>
                  <input
                    type="number"
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-md text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-neutral-900/80 border border-neutral-800 rounded-md text-xs text-neutral-300">
                <span className="text-neutral-500 font-medium">Technical Notes: </span>
                {analysisResult.technicalNotes}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-neutral-500">
                Recommended Pathway: <span className="text-blue-400 font-medium">{analysisResult.recommendedPathway}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Discard Draft
                </button>
                <button
                  onClick={handleConfirmDraft}
                  disabled={isPublishing}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  <span>Confirm & Register with Passport</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
