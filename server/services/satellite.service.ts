import { db } from '../db/store.ts';
import { findDumpSiteCandidates } from './ai.service.ts';
import type { SatelliteDetection } from '../../src/types/index.ts';

export interface SatelliteScanRegion {
  id: string;
  name: string;
  state: string;
  center: { lat: number; lng: number };
  bbox: [number, number, number, number];
}

// Scan anchors across selected Nigerian urban corridors. NASA GIBS VIIRS imagery
// is coarse; each screening footprint is the full source tile, not just this anchor.
const SCAN_REGIONS: SatelliteScanRegion[] = [
  { id: 'lagos-lasu-igando', name: 'LASU–Igando Expressway corridor', state: 'Lagos', center: { lat: 6.554784, lng: 3.247105 }, bbox: [3.197105, 6.504784, 3.297105, 6.604784] },
  { id: 'lagos-olusosun', name: 'Olusosun / Ojota', state: 'Lagos', center: { lat: 6.601, lng: 3.379 }, bbox: [3.329, 6.551, 3.429, 6.651] },
  { id: 'lagos-ikorodu', name: 'Ikorodu industrial corridor', state: 'Lagos', center: { lat: 6.619, lng: 3.498 }, bbox: [3.448, 6.569, 3.548, 6.669] },
  { id: 'abuja-gwarinpa', name: 'Gwarinpa / Kubwa', state: 'FCT', center: { lat: 9.105, lng: 7.394 }, bbox: [7.344, 9.055, 7.444, 9.155] },
  { id: 'kano-kumbotso', name: 'Kumbotso industrial corridor', state: 'Kano', center: { lat: 11.940, lng: 8.500 }, bbox: [8.450, 11.890, 8.550, 11.990] },
  { id: 'port-harcourt-eleme', name: 'Port Harcourt / Eleme', state: 'Rivers', center: { lat: 4.790, lng: 7.110 }, bbox: [7.060, 4.740, 7.160, 4.840] },
  { id: 'ibadan-oluyole', name: 'Ibadan / Oluyole', state: 'Oyo', center: { lat: 7.340, lng: 3.870 }, bbox: [3.820, 7.290, 3.920, 7.390] },
];

const GIBS_TILE_URL = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_CorrectedReflectance_TrueColor/default';
const GIBS_ZOOM = 9;

function configuredValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  if (!normalized || /^(MY_|YOUR_|REPLACE_|<|example)/i.test(normalized)) return undefined;
  return normalized;
}

function requiredEnvironment(name: string): string {
  const value = configuredValue(process.env[name]);
  if (!value) throw new Error(`${name} is not set in the server environment. Add it to .env and restart the server.`);
  return value;
}

export async function getSatelliteScanStatus() {
  const requiredKeys = ['GEMINI_API_KEY'];
  const missing = requiredKeys.filter((key) => !configuredValue(process.env[key]));
  let imageryDate: string | null = null;
  let imageryError: string | null = null;
  try {
    imageryDate = (await fetchNasaTile(SCAN_REGIONS[0])).date;
  } catch (error) {
    imageryError = error instanceof Error ? error.message : 'NASA GIBS imagery is unavailable.';
  }
  return {
    configured: missing.length === 0,
    missing,
    imagerySource: 'NASA EOSDIS GIBS · VIIRS NOAA-20 Corrected Reflectance (True Color)',
    imageryAvailable: imageryDate !== null,
    imageryDate,
    imageryError,
    nasaOpenApiKeyConfigured: Boolean(configuredValue(process.env.NASA_OPEN_API)),
    nasaOpenApiKeyNote: 'NASA_OPEN_API is a general api.nasa.gov key. GIBS imagery is public and does not accept or require that key.',
    imageryResolutionNote: 'VIIRS true-colour imagery is coarse (hundreds of metres per pixel); it cannot pinpoint small dump sites.',
    regions: SCAN_REGIONS.map(({ id, name, state, center }) => ({ id, name, state, center })),
  };
}

function lonToTileX(lng: number, zoom: number): number {
  return Math.floor(((lng + 180) / 360) * 2 ** zoom);
}

function latToTileY(lat: number, zoom: number): number {
  const radians = Math.max(-85.05112878, Math.min(85.05112878, lat)) * Math.PI / 180;
  return Math.floor((1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * 2 ** zoom);
}

function tileBounds(x: number, y: number, zoom: number): [number, number, number, number] {
  const count = 2 ** zoom;
  const lon = (tileX: number) => tileX / count * 360 - 180;
  const lat = (tileY: number) => Math.atan(Math.sinh(Math.PI * (1 - 2 * tileY / count))) * 180 / Math.PI;
  return [lon(x), lat(y + 1), lon(x + 1), lat(y)];
}

async function fetchNasaTile(region: SatelliteScanRegion) {
  const x = lonToTileX(region.center.lng, GIBS_ZOOM);
  const y = latToTileY(region.center.lat, GIBS_ZOOM);
  const tileBbox = tileBounds(x, y, GIBS_ZOOM);
  const date = new Date();

  // GIBS daily products can lag. Try recent UTC days, and use only a returned NASA tile.
  for (let daysAgo = 1; daysAgo <= 7; daysAgo += 1) {
    const day = new Date(date.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const url = `${GIBS_TILE_URL}/${day}/GoogleMapsCompatible_Level${GIBS_ZOOM}/${GIBS_ZOOM}/${y}/${x}.jpg`;
    const response = await fetch(url, { signal: AbortSignal.timeout(25_000) });
    if (!response.ok) continue;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('image/')) continue;
    const image = Buffer.from(await response.arrayBuffer());
    if (image.length < 1000) continue;
    return { image, date: day, tileId: `VIIRS_NOAA20/${day}/${GIBS_ZOOM}/${x}/${y}`, bbox: tileBbox };
  }
  throw new Error(`NASA GIBS did not return a recent VIIRS tile for ${region.name}. Try again later.`);
}

export async function scanSatelliteRegion(regionId: string): Promise<{
  region: Awaited<ReturnType<typeof getSatelliteScanStatus>>['regions'][number];
  scene: { id: string; datetime: string; cloudCover?: number };
  detections: SatelliteDetection[];
}> {
  const region = SCAN_REGIONS.find((candidate) => candidate.id === regionId);
  if (!region) throw new Error('Unknown scan region. Choose one of the supported Nigerian scan areas.');

  requiredEnvironment('GEMINI_API_KEY');
  const nasaTile = await fetchNasaTile(region);
  const scene = { id: nasaTile.tileId, datetime: `${nasaTile.date}T00:00:00Z` };
  const image = nasaTile.image;
  const findings = await findDumpSiteCandidates(image.toString('base64'), region.name, scene.datetime);
  const date = scene.datetime.slice(0, 10);
  const [west, south, east, north] = nasaTile.bbox;

  const detections: SatelliteDetection[] = findings.map((finding, index) => {
    const x = Math.min(1, Math.max(0, finding.x));
    const y = Math.min(1, Math.max(0, finding.y));
    const lat = north - y * (north - south);
    const lng = west + x * (east - west);
    return {
      id: `sat-live-nasa-${region.id}-${date}-${index + 1}`,
      sourceSatellite: 'VIIRS NOAA-20',
      targetArea: `${finding.label} · near ${region.name}`,
      lat,
      lng,
      detectionType: 'BROAD_SURFACE_ANOMALY',
      confidenceScore: finding.confidenceScore,
      status: 'UNVERIFIED_CANDIDATE',
      imageryDate: date,
      changeAreaSqm: finding.estimatedAreaSqm,
      detectionSource: 'LIVE_NASA_AI',
      sceneId: scene.id,
      candidateNotes: `AI visual screening of NASA EOSDIS GIBS VIIRS NOAA-20 corrected-reflectance true-colour imagery (${scene.id}, ${date}) flagged a coarse visual anomaly. ${finding.reasoning} VIIRS pixels are hundreds of metres across, so this marker only identifies a broad area and cannot resolve an individual dumpsite. This is unverified and requires higher-resolution imagery and field verification.`,
      bounds: {
        north: Math.min(90, lat + Math.abs(north - south) / 256),
        south: Math.max(-90, lat - Math.abs(north - south) / 256),
        east: Math.min(180, lng + Math.abs(east - west) / 256),
        west: Math.max(-180, lng - Math.abs(east - west) / 256),
      },
    };
  });

  const existing = db.get('satelliteDetections');
  for (const detection of detections) {
    const existingIndex = existing.findIndex((item) => item.id === detection.id);
    if (existingIndex >= 0) existing[existingIndex] = detection;
    else existing.unshift(detection);
  }
  if (detections.length > 0) db.persist();

  return {
    region: { id: region.id, name: region.name, state: region.state, center: region.center },
    scene,
    detections,
  };
}
