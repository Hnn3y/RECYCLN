import { db } from '../db/store.ts';
import type { IntegrationStatus } from '../../src/types/index.ts';

interface ProviderDefinition {
  category: string;
  name: string;
  keyName: string;
  envKeys: string[];
  requiredEnvKeys?: string[];
  description: string;
  documentationUrl: string;
  testFunction: (keys: Record<string, string>) => Promise<{ success: boolean; message: string }>;
}

const PROVIDERS: ProviderDefinition[] = [
  {
    category: 'Language & Vision AI',
    name: 'Google Gemini API (@google/genai)',
    keyName: 'GEMINI_API_KEY',
    envKeys: ['GEMINI_API_KEY'],
    description: 'Powers Operations Copilot, Vision Resource Scanner, Attribute Extraction, and AI Valuation.',
    documentationUrl: 'https://aistudio.google.com/app/apikey',
    testFunction: async (keys) => {
      const key = keys['GEMINI_API_KEY'] || process.env.GEMINI_API_KEY;
      if (!key || key === 'MY_GEMINI_API_KEY') {
        return { success: false, message: 'GEMINI_API_KEY is not configured in environment or integrations store.' };
      }
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        if (res.ok) {
          return { success: true, message: 'Successfully connected to Google Gemini API model registry.' };
        }
        return { success: false, message: `API responded with status HTTP ${res.status} (${res.statusText})` };
      } catch (e: any) {
        return { success: false, message: `Connection failed: ${e.message}` };
      }
    },
  },
  {
    category: 'Maps & Spatial Routing',
    name: 'Mapbox Geocoding & Base Map',
    keyName: 'MAPBOX_API_KEY',
    envKeys: ['MAPBOX_API_KEY', 'VITE_MAPBOX_ACCESS_TOKEN'],
    description: 'Mapbox geocoding is used for field-site lookup; public Mapbox token provides map tiles. Routing is not connected in this build.',
    documentationUrl: 'https://account.mapbox.com/',
    testFunction: async (keys) => {
      const key = keys['MAPBOX_API_KEY'] || process.env.MAPBOX_API_KEY;
      if (!key) {
        return { success: false, message: 'No Mapbox or OpenRouteService API key configured.' };
      }
      try {
        const [geocode, directions] = await Promise.all([
          fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/Lagos.json?access_token=${encodeURIComponent(key)}&limit=1`, { signal: AbortSignal.timeout(12_000) }),
          fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/3.3792,6.5244;3.3515,6.6018?overview=false&access_token=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(12_000) }),
        ]);
        if (!geocode.ok) return { success: false, message: `Mapbox geocoding returned HTTP ${geocode.status}.` };
        if (!directions.ok) return { success: false, message: `Mapbox Directions returned HTTP ${directions.status}; live routing is unavailable.` };
        const routeData = await directions.json() as { routes?: Array<{ distance: number; duration: number }> };
        if (!routeData.routes?.length) return { success: false, message: 'Mapbox authenticated, but no test driving route was returned.' };
        return { success: true, message: `Mapbox geocoding and driving directions are reachable (test route ${Math.round(routeData.routes[0].distance / 1000)} km).` };
      } catch (e: any) {
        return { success: false, message: `Mapbox connection error: ${e.message}` };
      }
    },
  },
  {
    category: 'Satellite & Earth Observation',
    name: 'NASA Open API + EOSDIS GIBS',
    keyName: 'NASA_OPEN_API',
    envKeys: ['NASA_OPEN_API'],
    description: 'Validates the NASA developer key and checks the public NASA GIBS VIIRS imagery feed. GIBS tiles do not require the key.',
    documentationUrl: 'https://api.nasa.gov/',
    testFunction: async (keys) => {
      const key = keys['NASA_OPEN_API'] || process.env.NASA_OPEN_API;
      if (!key) return { success: false, message: 'NASA_OPEN_API is not configured; NASA GIBS imagery itself is public and keyless.' };

      try {
        const keyResponse = await fetch(
          `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(key)}&date=2024-01-01`,
          { signal: AbortSignal.timeout(12_000) },
        );
        if (!keyResponse.ok) return { success: false, message: `NASA API key test returned HTTP ${keyResponse.status}.` };

        let imageryReachable = false;
        for (let daysAgo = 1; daysAgo <= 7 && !imageryReachable; daysAgo += 1) {
          const day = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
          const tileUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_CorrectedReflectance_TrueColor/default/${day}/GoogleMapsCompatible_Level9/9/260/248.jpg`;
          const imageryResponse = await fetch(tileUrl, { signal: AbortSignal.timeout(12_000) });
          imageryReachable = imageryResponse.ok && (imageryResponse.headers.get('content-type') || '').includes('image/');
        }
        if (!imageryReachable) {
          return { success: false, message: 'NASA API key is valid, but no recent GIBS tile was available in the last 7 days.' };
        }
        return { success: true, message: 'NASA API key is valid; public NASA EOSDIS GIBS VIIRS imagery is reachable.' };
      } catch (error: any) {
        return { success: false, message: `NASA service check failed: ${error.message}` };
      }
    },
  },
  {
    category: 'Maps & Spatial Routing',
    name: 'OpenRouteService Directions',
    keyName: 'OPENROUTESERVICE_API_KEY',
    envKeys: ['OPENROUTESERVICE_API_KEY'],
    description: 'Optional directions provider. Current dispatch routing uses Mapbox; OpenRouteService fallback is not wired.',
    documentationUrl: 'https://openrouteservice.org/dev/#/api-docs',
    testFunction: async (keys) => {
      const key = keys['OPENROUTESERVICE_API_KEY'] || process.env.OPENROUTESERVICE_API_KEY;
      if (!key) return { success: false, message: 'OPENROUTESERVICE_API_KEY is not configured.' };
      try {
        const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car?api_key=' + encodeURIComponent(key) + '&start=3.3792,6.5244&end=3.3515,6.6018', { signal: AbortSignal.timeout(12_000) });
        if (response.ok) return { success: true, message: 'OpenRouteService directions key is valid; this app does not yet use it for dispatch.' };
        return { success: false, message: `OpenRouteService returned HTTP ${response.status}.` };
      } catch (error: any) {
        return { success: false, message: `OpenRouteService check failed: ${error.message}` };
      }
    },
  },
  {
    category: 'Payments & Escrow',
    name: 'Flutterwave Payments API',
    keyName: 'FLUTTERWAVE_SECRET_KEY',
    envKeys: ['FLUTTERWAVE_SECRET_KEY'],
    description: 'Credential diagnostic only; checkout, webhook verification and settlement are not connected in this build.',
    documentationUrl: 'https://developer.flutterwave.com/docs',
    testFunction: async (keys) => {
      const key = keys['FLUTTERWAVE_SECRET_KEY'] || process.env.FLUTTERWAVE_SECRET_KEY;
      if (!key) return { success: false, message: 'FLUTTERWAVE_SECRET_KEY is not configured.' };
      try {
        const response = await fetch('https://api.flutterwave.com/v3/balances', {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(12_000),
        });
        if (response.ok) return { success: true, message: 'Flutterwave credentials authenticated; no payment workflow is connected.' };
        return { success: false, message: `Flutterwave returned HTTP ${response.status}.` };
      } catch (error: any) {
        return { success: false, message: `Flutterwave check failed: ${error.message}` };
      }
    },
  },
  {
    category: 'Earth Observation & Satellite',
    name: 'Copernicus Data Space OAuth',
    keyName: 'SENTINEL_HUB_CLIENT_ID',
    envKeys: ['SENTINEL_HUB_CLIENT_ID', 'SENTINEL_HUB_CLIENT_SECRET'],
    requiredEnvKeys: ['SENTINEL_HUB_CLIENT_ID', 'SENTINEL_HUB_CLIENT_SECRET'],
    description: 'Optional Copernicus OAuth diagnostic; the active satellite map and screening flow use public NASA EOSDIS GIBS imagery instead.',
    documentationUrl: 'https://dataspace.copernicus.eu/',
    testFunction: async (keys) => {
      const key = keys['SENTINEL_HUB_CLIENT_ID'] || process.env.SENTINEL_HUB_CLIENT_ID;
      const secret = keys['SENTINEL_HUB_CLIENT_SECRET'] || process.env.SENTINEL_HUB_CLIENT_SECRET;
      if (!key || !secret) {
        return { success: false, message: 'Set both SENTINEL_HUB_CLIENT_ID and SENTINEL_HUB_CLIENT_SECRET to test Copernicus OAuth.' };
      }

      try {
        const response = await fetch('https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: key,
            client_secret: secret,
            grant_type: 'client_credentials',
          }),
        });
        if (response.ok) {
          return { success: true, message: 'Copernicus Data Space OAuth authentication succeeded.' };
        }
        return { success: false, message: `Copernicus OAuth returned HTTP ${response.status}. Check the client credentials.` };
      } catch (error: any) {
        return { success: false, message: `Copernicus OAuth connection failed: ${error.message}` };
      }
    },
  },
  {
    category: 'Payments & Escrow',
    name: 'Paystack Escrow System',
    keyName: 'PAYSTACK_SECRET_KEY',
    envKeys: ['PAYSTACK_SECRET_KEY'],
    description: 'Transaction settlement, escrow holds, mobile money, and automated multi-tenant payouts.',
    documentationUrl: 'https://dashboard.paystack.com/#/settings/developer',
    testFunction: async (keys) => {
      const key = keys['PAYSTACK_SECRET_KEY'] || process.env.PAYSTACK_SECRET_KEY;
      if (!key) {
        return { success: false, message: 'PAYSTACK_SECRET_KEY is not configured. Payments operating in local ledger sandbox.' };
      }
      try {
        const res = await fetch('https://api.paystack.co/transaction/totals', {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (res.ok) {
          return { success: true, message: 'Paystack API authentication succeeded. No payment/escrow workflow is connected in this build.' };
        }
        return { success: false, message: `Paystack returned HTTP ${res.status}` };
      } catch (e: any) {
        return { success: false, message: `Paystack network error: ${e.message}` };
      }
    },
  },
  {
    category: 'Messaging & Notifications',
    name: 'Twilio SMS & WhatsApp Gateway',
    keyName: 'TWILIO_AUTH_TOKEN',
    envKeys: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'],
    requiredEnvKeys: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'],
    description: 'Driver dispatch alerts, weighbridge arrival notifications, and proof of delivery SMS receipts.',
    documentationUrl: 'https://console.twilio.com/',
    testFunction: async (keys) => {
      const accountSid = keys['TWILIO_ACCOUNT_SID'] || process.env.TWILIO_ACCOUNT_SID;
      const authToken = keys['TWILIO_AUTH_TOKEN'] || process.env.TWILIO_AUTH_TOKEN;
      if (!accountSid || !authToken) {
        return { success: false, message: 'Set both TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to test the messaging connection.' };
      }

      try {
        const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}.json`, {
          headers: { Authorization: `Basic ${credentials}` },
        });
        if (response.ok) {
          return { success: true, message: 'Twilio account authentication succeeded.' };
        }
        return { success: false, message: `Twilio returned HTTP ${response.status}. Check the account SID and auth token.` };
      } catch (error: any) {
        return { success: false, message: `Twilio connection failed: ${error.message}` };
      }
    },
  },
  {
    category: 'Email & Notifications',
    name: 'SendGrid Email API',
    keyName: 'SENDGRID_API_KEY',
    envKeys: ['SENDGRID_API_KEY'],
    description: 'Transactional email delivery for account notices, dispatch updates, and platform alerts.',
    documentationUrl: 'https://docs.sendgrid.com/',
    testFunction: async (keys) => {
      const key = keys['SENDGRID_API_KEY'] || process.env.SENDGRID_API_KEY;
      if (!key) {
        return { success: false, message: 'SENDGRID_API_KEY is not configured.' };
      }

      try {
        const response = await fetch('https://api.sendgrid.com/v3/scopes', {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (response.ok) {
          return { success: true, message: 'SendGrid API key authenticated successfully.' };
        }
        return { success: false, message: `SendGrid returned HTTP ${response.status}. Check the API key and its scopes.` };
      } catch (error: any) {
        return { success: false, message: `SendGrid connection failed: ${error.message}` };
      }
    },
  },
  {
    category: 'Object Storage',
    name: 'AWS S3 / Cloudinary Assets',
    keyName: 'AWS_ACCESS_KEY_ID',
    envKeys: ['AWS_ACCESS_KEY_ID', 'CLOUDINARY_URL'],
    description: 'Tamper-proof storage for Resource Passports, consignee signature photos, and drone orthomosaics.',
    documentationUrl: 'https://aws.amazon.com/s3/',
    testFunction: async (keys) => {
      const key = keys['AWS_ACCESS_KEY_ID'] || process.env.AWS_ACCESS_KEY_ID;
      if (!key) {
        return { success: false, message: 'Storage credentials not set. Operating on resilient internal asset store.' };
      }
      return { success: false, message: 'Storage credentials are present, but this build has no S3/Cloudinary client adapter. Uploads are not connected to external object storage.' };
    },
  },
];

export function getIntegrationsList(): IntegrationStatus[] {
  const customSettings = db.get('integrationSettings') || {};

  return PROVIDERS.map((p) => {
    const customKey = customSettings[p.keyName];
    const envKey = p.envKeys.map((k) => process.env[k]).find(Boolean);
    const hasRequiredKeys = p.requiredEnvKeys?.every((key) => Boolean(customSettings[key] || process.env[key]));
    const hasKey = p.requiredEnvKeys
      ? Boolean(hasRequiredKeys)
      : Boolean(customKey || (envKey && envKey !== 'MY_GEMINI_API_KEY'));

    return {
      category: p.category,
      name: p.name,
      keyName: p.keyName,
      isConfigured: hasKey,
      isCustomKeySet: Boolean(customKey),
      status: hasKey ? 'CONFIGURED' : 'NOT_CONFIGURED',
      description: p.description,
      documentationUrl: p.documentationUrl,
    };
  });
}

export async function testProviderConnection(keyName: string): Promise<{
  status: 'CONFIGURED' | 'NOT_CONFIGURED' | 'ERROR';
  message: string;
}> {
  const provider = PROVIDERS.find((p) => p.keyName === keyName);
  if (!provider) {
    return { status: 'ERROR', message: `Unknown integration provider: ${keyName}` };
  }

  const customSettings = db.get('integrationSettings') || {};
  const result = await provider.testFunction(customSettings);

  return {
    status: result.success ? 'CONFIGURED' : 'ERROR',
    message: result.message,
  };
}

export function saveIntegrationKey(keyName: string, keyValue: string): void {
  const current = db.get('integrationSettings') || {};
  current[keyName] = keyValue.trim();
  db.persist();
}
