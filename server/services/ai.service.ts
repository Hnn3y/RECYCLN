import { GoogleGenAI } from '@google/genai';
import { db, calculateDistanceKm } from '../db/store.ts';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || db.get('integrationSettings')?.['GEMINI_API_KEY'];
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface ScannerResult {
  detectedObject: string;
  materialType: string;
  category: string;
  estimatedPurityPercent: number;
  visibleCondition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'REFURBISHABLE' | 'SCRAP';
  approximateWeightEstimate: string;
  recommendedPathway: string;
  estimatedValuePerUnit: number;
  currency: string;
  technicalNotes: string;
}

export async function scanResourceImage(imageBase64?: string, textHint?: string): Promise<ScannerResult> {
  const ai = getAiClient();
  if (!ai) throw new Error('GEMINI_API_KEY is required for resource scanning.');
  if (!imageBase64 && !textHint) throw new Error('Provide an image or material description to scan.');

  try {
    const parts: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }
    parts.push({
      text: `You are RECYCLN's industrial vision and resource classification engine.
Analyze this industrial asset, material stockpile, scrap, or equipment:
${textHint ? `User description hint: ${textHint}` : ''}

Respond in strictly valid JSON with this format:
{
  "detectedObject": "Specific name of the asset or scrap item",
  "materialType": "Exact material specification (e.g. Aluminium 6063, rPET, S275 Structural Steel, Cu-ETP Copper)",
  "category": "One of: Non-Ferrous Metals, Ferrous Metals, Plastics & Polymers, High-Value Electrical Scrap, Construction Demolition, Organic Materials",
  "estimatedPurityPercent": 95,
  "visibleCondition": "One of: EXCELLENT, GOOD, FAIR, REFURBISHABLE, SCRAP",
  "approximateWeightEstimate": "Estimated weight range in metric tonnes or kg",
  "recommendedPathway": "One of: DIRECT_REUSE, REFURBISHMENT, SMELTING, CHEMICAL_RECYCLING, REMANUFACTURING",
  "estimatedValuePerUnit": 2100,
  "currency": "USD",
  "technicalNotes": "Short 2-sentence technical evaluation of recyclability, contamination, and handling precautions. State uncertainty; do not claim inspection or verification."
  }`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text?.trim();
      if (!text) throw new Error('The AI provider returned an empty scanner result.');
      const parsed = JSON.parse(text);
      return {
        detectedObject: parsed.detectedObject || 'Unclassified material',
        materialType: parsed.materialType || 'Unclassified',
        category: parsed.category || 'Unclassified',
        estimatedPurityPercent: Number(parsed.estimatedPurityPercent) || 0,
        visibleCondition: parsed.visibleCondition || 'FAIR',
        approximateWeightEstimate: parsed.approximateWeightEstimate || 'Not estimated from image',
        recommendedPathway: parsed.recommendedPathway || 'Requires human assessment',
        estimatedValuePerUnit: Number(parsed.estimatedValuePerUnit) || 0,
        currency: parsed.currency || 'USD',
        technicalNotes: parsed.technicalNotes || 'AI output requires human review; image alone does not verify material properties.',
      };
    } catch (error) {
      console.error('Gemini resource scan failed:', error instanceof Error ? error.message : 'Unknown provider error');
      throw new Error('Resource scanning failed; no synthetic result was substituted. Check Gemini connectivity and the AI response.');
    }
}

export interface DumpSiteVisualFinding {
  x: number;
  y: number;
  label: string;
  confidenceScore: number;
  estimatedAreaSqm: number;
  reasoning: string;
}

export async function findDumpSiteCandidates(
  imageBase64: string,
  regionName: string,
  imageryDate: string,
): Promise<DumpSiteVisualFinding[]> {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is required for AI satellite screening. Configure it in the server .env and restart the server.');
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
        {
          text: `You are screening a NASA VIIRS NOAA-20 corrected-reflectance true-colour satellite tile for broad possible land-surface anomalies near ${regionName}, Nigeria, with source date ${imageryDate}. VIIRS pixels are hundreds of metres across and the image is a broad regional tile, not high-resolution site imagery. Image origin is top-left; x grows right and y grows down.

Return JSON only in this exact shape: {"findings":[{"x":0.0,"y":0.0,"label":"broad anomaly area","confidenceScore":70,"estimatedAreaSqm":0,"reasoning":"brief visible evidence"}]}. x and y must be normalized from 0 to 1. Return at most 3 findings.

Be extremely conservative: at this resolution do not claim to identify a dumpsite or estimate its area. Only return a low-confidence broad visual anomaly if a conspicuous unusual exposed-surface pattern is clearly visible; otherwise return an empty findings array. Do not treat bare soil, settlements, industrial yards, quarries, fires, or cloud/haze as dumpsites. This image cannot resolve waste, establish a dumpsite, or support precise coordinates. A returned pin is only an approximate area for later inspection with higher-resolution imagery. Confidence is a model screening score, not a probability or verification. Never invent features.`
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });

  const text = response.text?.trim();
  if (!text) throw new Error('AI satellite screening returned an empty response.');
  const parsed = JSON.parse(text) as { findings?: Array<Partial<DumpSiteVisualFinding>> };
  if (!Array.isArray(parsed.findings)) throw new Error('AI satellite screening returned an invalid findings payload.');

  return parsed.findings
    .filter((finding) => Number.isFinite(finding.x) && Number.isFinite(finding.y))
    .map((finding) => ({
      x: Math.min(1, Math.max(0, Number(finding.x))),
      y: Math.min(1, Math.max(0, Number(finding.y))),
      label: String(finding.label || 'Possible exposed waste accumulation').slice(0, 100),
      confidenceScore: Math.min(100, Math.max(0, Math.round(Number(finding.confidenceScore) || 0))),
      estimatedAreaSqm: 0,
      reasoning: String(finding.reasoning || 'Visual anomaly flagged for field review.').slice(0, 500),
    }))
    .filter((finding) => finding.confidenceScore >= 40)
    .slice(0, 3);
}

export interface CopilotProcessResult {
  reply: string;
  mode: 'SUPPORT' | 'OPERATIONS' | 'TRANSACTION';
  toolCalls?: {
    toolName: string;
    input: any;
    output: any;
  }[];
  consequentialAction?: {
    actionType: string;
    summary: string;
    payload: any;
    executed: boolean;
  };
}

export async function processCopilotMessage(
  userQuery: string,
  userRole: string,
  userOrgId: string,
  mode: 'SUPPORT' | 'OPERATIONS' | 'TRANSACTION'
): Promise<CopilotProcessResult> {
  const ai = getAiClient();
  if (!ai) throw new Error('GEMINI_API_KEY is required for the Operations Copilot.');

  // Execute real database tool queries for context
  const activeResources = db.get('resources').filter((r) => r.status === 'AVAILABLE');
  const activeListings = db.get('listings').filter((l) => l.status === 'ACTIVE');
  const availableVehicles = db.get('vehicles').filter((v) => v.currentStatus === 'AVAILABLE');
  const facilities = db.get('facilities');
  const wanted = db.get('wantedRequests').filter((w) => w.status === 'OPEN');
  const activeJobs = db.get('logisticsJobs').filter((j) => j.status !== 'DELIVERED');
  const pendingReports = db.get('infrastructureReports').filter((r) => r.status !== 'RESOLVED');

  const queryLower = userQuery.toLowerCase();
  const toolCalls: any[] = [];

  // Tool selection: searchResources
  if (queryLower.includes('resource') || queryLower.includes('aluminium') || queryLower.includes('metal') || queryLower.includes('plastic') || queryLower.includes('steel')) {
    const matched = activeResources.filter(
      (r) =>
        r.name.toLowerCase().includes(queryLower) ||
        r.materialType.toLowerCase().includes(queryLower) ||
        r.category.toLowerCase().includes(queryLower)
    );
    toolCalls.push({
      toolName: 'searchResources',
      input: { query: userQuery, status: 'AVAILABLE' },
      output: {
        totalFound: matched.length,
        items: matched.slice(0, 3).map((r) => ({
          id: r.id,
          name: r.name,
          quantity: `${r.quantity} ${r.unit}`,
          location: r.locationName,
          value: `$${r.estimatedValue}`,
          owner: r.orgName,
        })),
      },
    });
  }

  // Tool selection: getFleetStatus
  if (queryLower.includes('fleet') || queryLower.includes('truck') || queryLower.includes('vehicle') || queryLower.includes('driver')) {
    toolCalls.push({
      toolName: 'getFleetStatus',
      input: { status: 'AVAILABLE' },
      output: {
        availableCount: availableVehicles.length,
        vehicles: availableVehicles.map((v) => ({
          plate: v.registrationPlate,
          type: v.type,
          capacityKg: v.capacityKg,
          location: v.locationName,
        })),
      },
    });
  }

  // Tool selection: checkFacilities
  if (queryLower.includes('facility') || queryLower.includes('capacity') || queryLower.includes('smelter') || queryLower.includes('plant')) {
    toolCalls.push({
      toolName: 'searchFacilities',
      input: { openCapacityOnly: true },
      output: {
        facilities: facilities.map((f) => ({
          name: f.name,
          type: f.facilityType,
          availableTonnesMonth: f.availableCapacityTonnesPerMonth,
          acceptedMaterials: f.acceptedMaterials,
          location: f.city,
        })),
      },
    });
  }

  try {
      const systemInstruction = `You are RECYCLN's AI Operations Copilot — an industrial operating system intelligence.
Operating Mode: ${mode}.
User Role: ${userRole}.
Organization: ${userOrgId}.
Always answer using real operational data provided in the context.
Never hallucinate inventory numbers or fabricate completed actions.
If a consequential action is generated, explicitly instruct the user to verify the confirmation card before executing.`;

      const prompt = `User Query: "${userQuery}"

Real Operational Data retrieved via backend tool calls:
${JSON.stringify(toolCalls, null, 2)}

Active Context:
- Available Resources: ${activeResources.length} items
- Active Marketplace Listings: ${activeListings.length} listings
- Fleet Availability: ${availableVehicles.length} of ${db.get('vehicles').length} trucks ready
- Open Wanted Requests: ${wanted.length}
- Active Logistics Trips: ${activeJobs.length}
- Open Infrastructure Triage: ${pendingReports.length} reports

Provide a concise, professional operational briefing and recommend next operational steps.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      const reply = response.text?.trim();
      if (!reply) throw new Error('The AI provider returned an empty Copilot response.');
      return {
        reply,
        mode,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
  } catch (error) {
    console.error('Gemini copilot request failed:', error instanceof Error ? error.message : 'Unknown provider error');
    throw new Error('Copilot request failed; no synthetic briefing or dispatch action was substituted. Check Gemini connectivity.');
  }
}

export function computeValuation(
  category: string,
  materialType: string,
  quantityTonnes: number,
  condition: string,
  distanceKm: number = 25
) {
  // Real material index pricing ($/tonne)
  const baseRates: Record<string, number> = {
    'Aluminium 6063': 2100,
    'Electrolytic Copper (Cu-ETP 99.9%)': 8700,
    'Mild Structural Steel S275': 550,
    'rPET (Polyethylene Terephthalate)': 520,
    'HDPE Flakes': 640,
    'Industrial Scrap Grade A': 1200,
  };

  const baseRate = baseRates[materialType] || (category.includes('Metal') ? 1400 : 500);

  const conditionMultipliers: Record<string, number> = {
    EXCELLENT: 1.05,
    GOOD: 0.95,
    FAIR: 0.82,
    REFURBISHABLE: 0.88,
    SCRAP: 0.72,
  };

  const multiplier = conditionMultipliers[condition] || 0.9;
  const grossValue = quantityTonnes * baseRate * multiplier;
  const transportCost = 150 + distanceKm * 3.5 * Math.ceil(quantityTonnes / 25);
  const processingFee = grossValue * 0.06;
  const netRecoveryValue = Math.max(0, grossValue - transportCost - processingFee);

  return {
    baseRatePerTonne: baseRate,
    conditionMultiplier: multiplier,
    grossMarketValue: Math.round(grossValue),
    estimatedTransportCost: Math.round(transportCost),
    estimatedProcessingFee: Math.round(processingFee),
    estimatedNetRecoveryValue: Math.round(netRecoveryValue),
    currency: 'USD',
    disclaimer: 'Estimated value based on regional scrap benchmarks — not a guaranteed market price.',
  };
}
