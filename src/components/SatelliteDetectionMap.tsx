import React, { useMemo, useState } from 'react';
import { divIcon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { Eye, Layers3, LoaderCircle, MapPin, Search, Satellite, Send, X } from 'lucide-react';
import type { SatelliteDetection } from '../types/index.ts';
import { api } from '../services/api.ts';

const nasaDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const candidateIcon = divIcon({
  className: 'recycln-map-marker',
  html: '<span class="recycln-marker-pin" style="--marker-color:#f59e0b"><span></span></span>',
  iconSize: [34, 42],
  iconAnchor: [17, 34],
});
const selectedIcon = divIcon({
  className: 'recycln-map-marker',
  html: '<span class="recycln-marker-pin is-selected" style="--marker-color:#f8fafc"><span></span></span>',
  iconSize: [34, 42],
  iconAnchor: [17, 34],
});

interface SatelliteDetectionMapProps {
  detections: SatelliteDetection[];
  imageryDate?: string;
  reporterName?: string;
  reporterOrgName?: string;
  onReportCreated: () => Promise<void>;
}

function MapClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (event) => onPick(event.latlng.lat, event.latlng.lng) });
  return null;
}

function MapFocus({ target }: { target: { lat: number; lng: number; key: string } | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 15), { duration: 0.7 });
  }, [map, target]);
  return null;
}

export const SatelliteDetectionMap: React.FC<SatelliteDetectionMapProps> = ({
  detections,
  imageryDate,
  reporterName,
  reporterOrgName,
  onReportCreated,
}) => {
  const tileDate = imageryDate || nasaDate;
  const currentNasaTileUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_CorrectedReflectance_TrueColor/default/${tileDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
  const [showNasaImagery, setShowNasaImagery] = useState(true);
  const [searchText, setSearchText] = useState('LASU-Igando Expressway, Lagos, Nigeria');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; label: string; lat: number; lng: number }>>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lng: number; key: string } | null>(null);
  const [draftPoint, setDraftPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [siteName, setSiteName] = useState('LASU-Igando Expressway — observed dumpsite');
  const [siteNotes, setSiteNotes] = useState('User-observed location. Exact marker position selected on the map; requires independent field verification.');
  const [savingReport, setSavingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const liveCount = useMemo(
    () => detections.filter((detection) => detection.detectionSource === 'LIVE_NASA_AI').length,
    [detections],
  );

  const runSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchText.trim() || searching) return;
    setSearching(true);
    setSearchError('');
    setSearchResults([]);
    try {
      const results = await api.geocodeNigeria(searchText.trim());
      setSearchResults(results);
      if (!results.length) setSearchError('No matching Nigeria location found. Try a nearby landmark or locality.');
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Location search failed.');
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (result: { id: string; label: string; lat: number; lng: number }) => {
    setSearchText(result.label);
    setSearchResults([]);
    setFocusTarget({ lat: result.lat, lng: result.lng, key: `${result.id}-${Date.now()}` });
    setDraftPoint({ lat: result.lat, lng: result.lng });
    setReportMessage('Search result is an address/road reference, not a verified dumpsite coordinate. Click the exact visible location on the map to refine the pin.');
  };

  const saveFieldReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draftPoint || savingReport || siteName.trim().length < 4) return;
    setSavingReport(true);
    setReportMessage('');
    try {
      await api.createSatelliteFieldReport({
        targetArea: siteName.trim(),
        lat: draftPoint.lat,
        lng: draftPoint.lng,
        reporterName,
        reporterOrgName,
        candidateNotes: siteNotes,
      });
      setReportMessage('Field-observed candidate saved and pinned. It is labelled unverified until reviewed.');
      setDraftPoint(null);
      await onReportCreated();
    } catch (error) {
      setReportMessage(error instanceof Error ? error.message : 'Could not save field observation.');
    } finally {
      setSavingReport(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900" aria-label="Nigeria satellite detections map">
      <div className="flex flex-col gap-3 border-b border-neutral-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300">
            <Satellite className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">Nigeria satellite intelligence map</h2>
            <p className="text-[10px] text-neutral-500">{detections.length} non-demo reported/candidate pins · {liveCount} AI-screened area leads</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowNasaImagery((visible) => !visible)}
          aria-pressed={showNasaImagery}
          className={`inline-flex items-center justify-center gap-2 self-start rounded-lg border px-3 py-1.5 text-[11px] font-medium transition sm:self-auto ${showNasaImagery ? 'border-cyan-700 bg-cyan-950/60 text-cyan-200' : 'border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-cyan-800'}`}
        >
          {showNasaImagery ? <Layers3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showNasaImagery ? `NASA VIIRS · ${tileDate}` : 'Show NASA imagery'}
        </button>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="relative h-[400px] w-full bg-[#10191a] sm:h-[500px]">
          <MapContainer center={[9.05, 7.5]} zoom={5} minZoom={4} maxZoom={18} scrollWheelZoom className="h-full w-full bg-[#10191a]">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={20}
            />
            {showNasaImagery && (
              <TileLayer
                attribution='&copy; <a href="https://www.earthdata.nasa.gov/data/instruments/viirs">NASA EOSDIS GIBS / VIIRS</a>'
                url={currentNasaTileUrl}
                maxNativeZoom={9}
                maxZoom={18}
                opacity={0.83}
                zIndex={300}
              />
            )}
            <ZoomControl position="bottomright" />
            <MapClickPicker onPick={(lat, lng) => { setDraftPoint({ lat, lng }); setReportMessage('Exact clicked coordinate selected. Save it as a user-reported candidate after confirming the site name.'); }} />
            <MapFocus target={focusTarget} />
            {detections.map((detection) => (
              <Marker key={detection.id} position={[detection.lat, detection.lng]} icon={candidateIcon}>
                <Popup>
                  <div className="min-w-48 space-y-1 text-xs">
                    <strong>{detection.targetArea}</strong>
                    <div>{detection.detectionSource === 'LIVE_NASA_AI' ? 'NASA + AI broad anomaly lead' : detection.detectionSource === 'FIELD_REPORTED' ? `Reported by ${detection.reporterName || 'field observer'} · not independently verified` : 'Demo record hidden unless manually reintroduced'}</div>
                    <div>{detection.detectionType.replace(/_/g, ' ')}</div>
                    <div>{detection.sourceSatellite} · {detection.detectionSource === 'FIELD_REPORTED' ? `reported ${detection.reportedAt || detection.imageryDate}` : `imagery ${detection.imageryDate}`}</div>
                    <div>{detection.lat.toFixed(6)}, {detection.lng.toFixed(6)}</div>
                    <div className="text-amber-700">Unverified: conduct field inspection</div>
                  </div>
                </Popup>
              </Marker>
            ))}
            {draftPoint && (
              <Marker position={[draftPoint.lat, draftPoint.lng]} icon={selectedIcon}>
                <Popup>Draft field observation pin · {draftPoint.lat.toFixed(6)}, {draftPoint.lng.toFixed(6)}</Popup>
              </Marker>
            )}
          </MapContainer>
          <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg border border-white/10 bg-neutral-950/85 px-3 py-2 text-[10px] text-neutral-200 shadow backdrop-blur-md">
            Nigeria · NASA EOSDIS VIIRS NOAA-20 · click map to mark observed location
          </div>
          <div className="pointer-events-none absolute bottom-3 left-3 z-[500] max-w-[min(34rem,calc(100%-1.5rem))] rounded-lg border border-amber-900/60 bg-neutral-950/90 px-3 py-2 text-[10px] leading-relaxed text-amber-100 shadow backdrop-blur-md">
            VIIRS pixels are hundreds of metres wide; its AI marks cannot identify individual dumpsites. Use user-observed coordinates or higher-resolution imagery for exact site pins.
          </div>
        </div>

        <aside className="space-y-3 border-t border-neutral-800 p-4 xl:border-l xl:border-t-0">
          <form onSubmit={runSearch} className="space-y-2">
            <label htmlFor="nigeria-map-search" className="block text-xs font-semibold text-white">Find area with Mapbox</label>
            <div className="flex gap-2">
              <input id="nigeria-map-search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="LASU-Igando Expressway, Lagos" className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-2 text-[11px] text-white outline-none focus:border-cyan-500" />
              <button type="submit" disabled={searching} aria-label="Search map" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 disabled:opacity-50">
                {searching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950">
                {searchResults.map((result) => (
                  <button type="button" key={result.id} onClick={() => selectSearchResult(result)} className="block w-full border-b border-neutral-800 px-3 py-2 text-left text-[10px] text-neutral-300 last:border-b-0 hover:bg-neutral-800">
                    {result.label}
                  </button>
                ))}
              </div>
            )}
            {searchError && <p className="text-[10px] text-amber-300">{searchError}</p>}
          </form>

          <form onSubmit={saveFieldReport} className="space-y-2 border-t border-neutral-800 pt-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white">Pin a site you observed</h3>
              {draftPoint && <button type="button" onClick={() => setDraftPoint(null)} className="text-neutral-500 hover:text-white" aria-label="Clear draft pin"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <p className="text-[10px] leading-relaxed text-neutral-500">Search the road, then click the exact dump location on the map. A road search result alone is not an exact dumpsite pin.</p>
            <label className="block text-[10px] text-neutral-400" htmlFor="reported-site-name">Site description</label>
            <input id="reported-site-name" value={siteName} onChange={(event) => setSiteName(event.target.value)} required minLength={4} maxLength={160} className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-2 text-[11px] text-white outline-none focus:border-cyan-500" />
            <label className="block text-[10px] text-neutral-400" htmlFor="reported-site-notes">Observation notes</label>
            <textarea id="reported-site-notes" value={siteNotes} onChange={(event) => setSiteNotes(event.target.value)} maxLength={1200} rows={3} className="w-full resize-y rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-2 text-[11px] text-white outline-none focus:border-cyan-500" />
            {draftPoint ? (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-300"><MapPin className="h-3 w-3" />{draftPoint.lat.toFixed(6)}, {draftPoint.lng.toFixed(6)}</div>
            ) : <p className="text-[10px] text-amber-300">Click the exact point on the map to place a draft pin.</p>}
            <button type="submit" disabled={!draftPoint || savingReport} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40">
              {savingReport ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Save field-reported pin
            </button>
            {reportMessage && <p role="status" className="text-[10px] leading-relaxed text-neutral-300">{reportMessage}</p>}
          </form>
          <p className="border-t border-neutral-800 pt-3 text-[10px] leading-relaxed text-neutral-500">Field reports are user-submitted observations, not authenticated evidence. Independently verify before enforcement or public claims.</p>
        </aside>
      </div>
    </section>
  );
};