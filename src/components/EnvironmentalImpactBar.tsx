import React from 'react';
import type { EnvironmentalMetric } from '../types/index.ts';
import { Leaf, Droplets, Wind, Scale } from 'lucide-react';

interface EnvironmentalImpactBarProps {
  metrics: EnvironmentalMetric | null;
}

export const EnvironmentalImpactBar: React.FC<EnvironmentalImpactBarProps> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-neutral-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Circular Network Environmental Impact Ledger
          </span>
        </div>
        <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
          <span>Assay Methodology:</span>
          <span className="text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
            {metrics.tag}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <div className="text-neutral-500 text-[11px] flex items-center gap-1.5">
            <Scale className="w-3 h-3 text-emerald-400" />
            <span>Material Diverted</span>
          </div>
          <div className="font-mono text-base font-bold text-white tabular-nums mt-0.5">
            {metrics.materialDivertedTonnes.toLocaleString()} tonnes
          </div>
          <div className="text-[10px] text-neutral-500">From municipal landfills</div>
        </div>

        <div>
          <div className="text-neutral-500 text-[11px] flex items-center gap-1.5">
            <Wind className="w-3 h-3 text-emerald-400" />
            <span>CO2e Avoided</span>
          </div>
          <div className="font-mono text-base font-bold text-emerald-400 tabular-nums mt-0.5">
            {(metrics.co2AvoidedKg / 1000).toFixed(1)} MT CO2e
          </div>
          <div className="text-[10px] text-neutral-500">Virgin smelting emissions</div>
        </div>

        <div>
          <div className="text-neutral-500 text-[11px] flex items-center gap-1.5">
            <Droplets className="w-3 h-3 text-blue-400" />
            <span>Process Water Saved</span>
          </div>
          <div className="font-mono text-base font-bold text-blue-400 tabular-nums mt-0.5">
            {(metrics.waterPreservedLiters / 1000).toLocaleString()} kL
          </div>
          <div className="text-[10px] text-neutral-500">Industrial process cooling</div>
        </div>

        <div>
          <div className="text-neutral-500 text-[11px] flex items-center gap-1.5">
            <Leaf className="w-3 h-3 text-emerald-400" />
            <span>Virgin Feedstock Preserved</span>
          </div>
          <div className="font-mono text-base font-bold text-white tabular-nums mt-0.5">
            {metrics.virginMaterialSavedTonnes.toLocaleString()} tonnes
          </div>
          <div className="text-[10px] text-neutral-500">Bauxite & iron ore mining offset</div>
        </div>
      </div>
    </div>
  );
};
