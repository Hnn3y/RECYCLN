import { Router, type Request, type Response } from 'express';
import { db, calculateDistanceKm } from '../db/store.ts';
import type {
  Resource,
  ResourcePassport,
  Listing,
  WantedRequest,
  Transaction,
  CapacityReservation,
  LogisticsJob,
  InfrastructureReport,
  AuditLog,
} from '../../src/types/index.ts';
import {
  scanResourceImage,
  processCopilotMessage,
  computeValuation,
} from '../services/ai.service.ts';
import {
  getIntegrationsList,
  testProviderConnection,
  saveIntegrationKey,
} from '../services/integration.service.ts';
import { getSatelliteScanStatus, scanSatelliteRegion } from '../services/satellite.service.ts';

export const apiRouter = Router();

// Helper to record audit log
function recordAudit(
  actorId: string,
  actorName: string,
  actorRole: string,
  orgId: string,
  action: string,
  entityType: string,
  entityId: string,
  details: string,
  req: Request
) {
  const auditLogs = db.get('auditLogs');
  const log: AuditLog = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actorId,
    actorName,
    actorRole,
    orgId,
    action,
    entityType,
    entityId,
    details,
    ipAddress: req.ip || '127.0.0.1',
  };
  auditLogs.unshift(log);
  db.persist();
}

// -------------------------------------------------------------
// 1. AUTH & TENANCY
// -------------------------------------------------------------
apiRouter.get('/auth/context', (req: Request, res: Response) => {
  const users = db.get('users');
  const orgs = db.get('organizations');
  res.json({
    users,
    organizations: orgs,
  });
});

// -------------------------------------------------------------
// 2. RESOURCE MANAGEMENT & PASSPORTS
// -------------------------------------------------------------
apiRouter.get('/resources', (req: Request, res: Response) => {
  const { status, category, search, orgId } = req.query;
  let list = db.get('resources');

  if (orgId) {
    list = list.filter((r) => r.orgId === orgId);
  }
  if (status) {
    list = list.filter((r) => r.status === status);
  }
  if (category) {
    list = list.filter((r) => r.category === category);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.materialType.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }
  res.json(list);
});

apiRouter.post('/resources', async (req: Request, res: Response) => {
  const {
    orgId,
    name,
    category,
    materialType,
    description,
    quantity,
    unit,
    locationName,
    lat,
    lng,
    condition,
    estimatedValue,
    currency,
    origin,
    images,
    actorName = 'Operator',
    actorRole = 'COMPANY_ADMIN',
  } = req.body;

  if (!orgId || !name || !quantity || !materialType) {
    return res.status(400).json({ error: 'Missing required resource fields.' });
  }

  const org = db.get('organizations').find((o) => o.id === orgId);
  const resourceId = `res-${Date.now().toString(36)}`;
  const passportId = `PASSPORT-${Date.now().toString(36).toUpperCase()}`;
  const qrCodeId = `QR-${resourceId.toUpperCase()}`;

  const resource: Resource = {
    id: resourceId,
    orgId,
    orgName: org?.name || 'Authorized Member',
    name,
    category: category || 'Industrial Materials',
    materialType,
    description: description || '',
    quantity: Number(quantity),
    unit: unit || 'tonnes',
    locationName: locationName || org?.address || 'Site Yard',
    lat: Number(lat) || org?.lat || 6.5244,
    lng: Number(lng) || org?.lng || 3.3792,
    condition: condition || 'GOOD',
    estimatedValue: Number(estimatedValue) || 1000,
    currency: currency || 'USD',
    availabilityDate: new Date().toISOString().split('T')[0],
    status: 'AVAILABLE',
    origin: origin || 'Industrial Facility',
    qrCodeId,
    passportId,
    images: images && images.length > 0 ? images : [
      'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const passport: ResourcePassport = {
    id: passportId,
    resourceId,
    batchCode: `BATCH-${new Date().getFullYear()}-${resourceId.slice(-4).toUpperCase()}`,
    digitalFingerprint: `sha256:${Math.random().toString(36).substring(2)}${Date.now()}`,
    materialPurity: 96.5,
    carbonOffsetKg: Math.round(Number(quantity) * 1800),
    circularityScore: 92,
    provenance: origin || 'Industrial Facility Deconstruction',
    currentOwnerOrgId: orgId,
    previousOwners: [org?.name || 'Primary Holder'],
    recommendedRecoveryPathway: 'SMELTING',
    createdAt: new Date().toISOString(),
    history: [
      {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventType: 'CREATED',
        actorName,
        actorOrg: org?.name || 'Organization',
        location: locationName || 'Primary Staging',
        notes: `Initial intake and digital passport provisioning for ${quantity} ${unit} of ${name}.`,
      },
    ],
  };

  await db.withTransaction(() => {
    db.get('resources').unshift(resource);
    db.get('passports').unshift(passport);
  });

  recordAudit(
    req.body.actorId || 'usr-default',
    actorName,
    actorRole,
    orgId,
    'RESOURCE_CREATED',
    'Resource',
    resourceId,
    `Registered ${quantity} ${unit} of ${name} with digital passport ${passportId}`,
    req
  );

  res.status(201).json(resource);
});

apiRouter.get('/resources/:id/passport', (req: Request, res: Response) => {
  const { id } = req.params;
  const passport = db.get('passports').find((p) => p.resourceId === id || p.id === id);
  if (!passport) {
    return res.status(404).json({ error: 'Resource Passport not found for this identifier.' });
  }
  const resource = db.get('resources').find((r) => r.id === passport.resourceId);
  res.json({
    passport,
    resource,
  });
});

// -------------------------------------------------------------
// 3. AI RESOURCE SCANNER (VISION AI)
// -------------------------------------------------------------
apiRouter.post('/scanner/analyze', async (req: Request, res: Response) => {
  const { imageBase64, textHint } = req.body;
  try {
    const analysis = await scanResourceImage(imageBase64, textHint);
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: 'Scanner analysis failed', message: err.message });
  }
});

// -------------------------------------------------------------
// 4. INVENTORY & WAREHOUSES
// -------------------------------------------------------------
apiRouter.get('/inventory/warehouses', (req: Request, res: Response) => {
  const warehouses = db.get('warehouses');
  res.json(warehouses);
});

apiRouter.get('/inventory/movements', (req: Request, res: Response) => {
  const movements = db.get('stockMovements');
  res.json(movements);
});

apiRouter.post('/inventory/transfer', async (req: Request, res: Response) => {
  const {
    resourceId,
    fromWarehouseId,
    toWarehouseId,
    quantity,
    reason,
    actorId = 'usr-admin',
    actorName = 'Operations Manager',
  } = req.body;

  if (!resourceId || !fromWarehouseId || !toWarehouseId || !quantity) {
    return res.status(400).json({ error: 'Missing required transfer fields.' });
  }

  const numQty = Number(quantity);
  const resource = db.get('resources').find((r) => r.id === resourceId);
  const fromWh = db.get('warehouses').find((w) => w.id === fromWarehouseId);
  const toWh = db.get('warehouses').find((w) => w.id === toWarehouseId);

  if (!resource || !fromWh || !toWh) {
    return res.status(404).json({ error: 'Resource or warehouse not found.' });
  }

  if (numQty > resource.quantity) {
    return res.status(400).json({
      error: `Transfer quantity (${numQty}) exceeds available resource quantity (${resource.quantity} ${resource.unit}).`,
    });
  }

  const movementId = `sm-${Date.now().toString(36)}`;
  const movement = {
    id: movementId,
    resourceId,
    resourceName: resource.name,
    fromWarehouseId,
    fromWarehouseName: fromWh.name,
    toWarehouseId,
    toWarehouseName: toWh.name,
    quantity: numQty,
    unit: resource.unit,
    performedByUserId: actorId,
    status: 'COMPLETED' as const,
    timestamp: new Date().toISOString(),
    reason: reason || 'Inventory balancing transfer',
  };

  await db.withTransaction(() => {
    fromWh.currentOccupancyTonnes = Math.max(0, fromWh.currentOccupancyTonnes - numQty);
    toWh.currentOccupancyTonnes += numQty;
    db.get('stockMovements').unshift(movement);

    // Update passport history
    const passport = db.get('passports').find((p) => p.resourceId === resourceId);
    if (passport) {
      passport.history.unshift({
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventType: 'TRANSFERRED',
        actorName,
        actorOrg: resource.orgName || 'Owner',
        location: toWh.name,
        notes: `Transferred ${numQty} ${resource.unit} from ${fromWh.name} to ${toWh.name}. Reason: ${reason}`,
      });
    }
  });

  recordAudit(
    actorId,
    actorName,
    'LOGISTICS_OPERATOR',
    resource.orgId,
    'INVENTORY_TRANSFERRED',
    'StockMovement',
    movementId,
    `Transferred ${numQty} ${resource.unit} of ${resource.name} to ${toWh.name}`,
    req
  );

  res.status(201).json(movement);
});

// -------------------------------------------------------------
// 5. B2B MARKETPLACE, WANTED REQUESTS & MATCHING
// -------------------------------------------------------------
apiRouter.get('/marketplace/listings', (req: Request, res: Response) => {
  const { listingType, category } = req.query;
  let list = db.get('listings');
  if (listingType) {
    list = list.filter((l) => l.listingType === listingType);
  }
  if (category) {
    list = list.filter((l) => l.category === category);
  }
  res.json(list);
});

apiRouter.post('/marketplace/listings', async (req: Request, res: Response) => {
  const {
    orgId,
    resourceId,
    title,
    listingType = 'SELL',
    pricePerUnit,
    minimumOrderQuantity = 1,
    terms,
    exchangeWantedMaterial,
    actorName = 'Seller Rep',
  } = req.body;

  const org = db.get('organizations').find((o) => o.id === orgId);
  const resource = db.get('resources').find((r) => r.id === resourceId);

  if (!org || !resource) {
    return res.status(400).json({ error: 'Valid organization and resource are required.' });
  }

  const listingId = `list-${Date.now().toString(36)}`;
  const listing: Listing = {
    id: listingId,
    orgId,
    orgName: org.name,
    resourceId,
    resource,
    title: title || `${resource.quantity} ${resource.unit} ${resource.name}`,
    listingType,
    category: resource.category,
    materialType: resource.materialType,
    quantity: resource.quantity,
    unit: resource.unit,
    pricePerUnit: Number(pricePerUnit) || Math.round(resource.estimatedValue / resource.quantity),
    currency: resource.currency,
    minimumOrderQuantity: Number(minimumOrderQuantity),
    locationName: resource.locationName,
    lat: resource.lat,
    lng: resource.lng,
    condition: resource.condition,
    terms: terms || 'Standard RECYCLN Escrow terms with weightbridge verification.',
    status: 'ACTIVE',
    exchangeWantedMaterial,
    createdAt: new Date().toISOString(),
  };

  await db.withTransaction(() => {
    db.get('listings').unshift(listing);
  });

  recordAudit(
    req.body.actorId || 'usr-default',
    actorName,
    'COMPANY_ADMIN',
    orgId,
    'LISTING_PUBLISHED',
    'Listing',
    listingId,
    `Published ${listingType} listing for ${resource.name} at $${listing.pricePerUnit}/${listing.unit}`,
    req
  );

  res.status(201).json(listing);
});

apiRouter.get('/marketplace/wanted', (req: Request, res: Response) => {
  res.json(db.get('wantedRequests'));
});

apiRouter.post('/marketplace/wanted', async (req: Request, res: Response) => {
  const {
    orgId,
    materialType,
    desiredQuantity,
    unit,
    maxDistanceKm = 50,
    targetLocation,
    targetLat,
    targetLng,
    maxPricePerUnit,
    currency = 'USD',
    deadline,
  } = req.body;

  const org = db.get('organizations').find((o) => o.id === orgId);
  if (!org || !materialType || !desiredQuantity) {
    return res.status(400).json({ error: 'Missing required wanted request fields.' });
  }

  const wanted: WantedRequest = {
    id: `req-${Date.now().toString(36)}`,
    orgId,
    orgName: org.name,
    materialType,
    desiredQuantity: Number(desiredQuantity),
    unit: unit || 'tonnes',
    maxDistanceKm: Number(maxDistanceKm),
    targetLat: Number(targetLat) || org.lat,
    targetLng: Number(targetLng) || org.lng,
    targetLocation: targetLocation || org.address,
    maxPricePerUnit: Number(maxPricePerUnit) || 2000,
    currency,
    deadline: deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };

  await db.withTransaction(() => {
    db.get('wantedRequests').unshift(wanted);
  });

  res.status(201).json(wanted);
});

apiRouter.get('/marketplace/match', (req: Request, res: Response) => {
  const { wantedId } = req.query;
  const listings = db.get('listings').filter((l) => l.status === 'ACTIVE');
  const wanted = db.get('wantedRequests').find((w) => w.id === wantedId) || db.get('wantedRequests')[0];

  if (!wanted) {
    return res.json([]);
  }

  const matches = listings.map((l) => {
    const dist = calculateDistanceKm(wanted.targetLat, wanted.targetLng, l.lat, l.lng);
    const materialMatch =
      l.materialType.toLowerCase().includes(wanted.materialType.toLowerCase()) ||
      wanted.materialType.toLowerCase().includes(l.materialType.toLowerCase());

    const distanceFit = dist <= wanted.maxDistanceKm;
    const quantityPct = Math.min(100, Math.round((l.quantity / wanted.desiredQuantity) * 100));

    let score = 0;
    if (materialMatch) score += 50;
    if (distanceFit) score += 30;
    else if (dist <= wanted.maxDistanceKm * 1.5) score += 15;
    score += Math.round(quantityPct * 0.2);

    const explanation = `Material: ${materialMatch ? 'Exact Match (100%)' : 'Alternative Grade'} · Distance: ${dist} km (${distanceFit ? 'Within ' + wanted.maxDistanceKm + 'km radius' : 'Exceeds target radius'}) · Quantity: ${l.quantity}/${wanted.desiredQuantity} ${l.unit} (${quantityPct}% fulfilled) · Price: $${l.pricePerUnit}/${l.unit}`;

    return {
      listingId: l.id,
      listing: l,
      compatibilityScore: Math.min(99, score),
      materialMatch,
      distanceKm: dist,
      quantityFulfillmentPercent: quantityPct,
      conditionFit: l.condition === 'EXCELLENT' || l.condition === 'GOOD',
      explanation,
    };
  });

  matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  res.json(matches);
});

apiRouter.post('/marketplace/valuation', (req: Request, res: Response) => {
  const { category, materialType, quantityTonnes, condition, distanceKm } = req.body;
  const valuation = computeValuation(
    category || 'Non-Ferrous Metals',
    materialType || 'Aluminium 6063',
    Number(quantityTonnes) || 10,
    condition || 'GOOD',
    Number(distanceKm) || 30
  );
  res.json(valuation);
});

// -------------------------------------------------------------
// 6. TRANSACTIONS & PAYMENTS
// -------------------------------------------------------------
apiRouter.get('/transactions', (req: Request, res: Response) => {
  res.json(db.get('transactions'));
});

apiRouter.post('/transactions/offer', async (req: Request, res: Response) => {
  const { listingId, buyerOrgId, quantity, actorName = 'Buyer Agent' } = req.body;
  const listing = db.get('listings').find((l) => l.id === listingId);
  const buyerOrg = db.get('organizations').find((o) => o.id === buyerOrgId);

  if (!listing || !buyerOrg) {
    return res.status(404).json({ error: 'Listing or buyer organization not found.' });
  }

  const numQty = Number(quantity) || listing.quantity;
  const totalAmount = numQty * listing.pricePerUnit;
  const txId = `tx-${Date.now().toString(36)}`;

  const transaction: Transaction = {
    id: txId,
    referenceNumber: `TX-REC-${Date.now().toString().slice(-6)}`,
    listingId: listing.id,
    listingTitle: listing.title,
    sellerOrgId: listing.orgId,
    sellerOrgName: listing.orgName,
    buyerOrgId: buyerOrg.id,
    buyerOrgName: buyerOrg.name,
    resourceId: listing.resourceId || 'res-gen',
    quantity: numQty,
    unit: listing.unit,
    totalAmount,
    currency: listing.currency,
    transactionType: listing.listingType,
    status: 'OFFER',
    paymentStatus: 'UNPAID',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.withTransaction(() => {
    db.get('transactions').unshift(transaction);
  });

  recordAudit(
    req.body.actorId || 'usr-default',
    actorName,
    'BUYER',
    buyerOrgId,
    'OFFER_SUBMITTED',
    'Transaction',
    txId,
    `Submitted offer for ${numQty} ${listing.unit} on ${listing.title} ($${totalAmount})`,
    req
  );

  res.status(201).json(transaction);
});

apiRouter.post('/transactions/:id/accept', async (req: Request, res: Response) => {
  const { id } = req.params;
  const tx = db.get('transactions').find((t) => t.id === id);
  if (!tx) return res.status(404).json({ error: 'Transaction not found.' });

  await db.withTransaction(() => {
    tx.status = 'ACCEPTED';
    tx.paymentStatus = 'ESCROW_HELD';
    tx.paymentProvider = 'Paystack Escrow System';
    tx.paymentReference = `PAY-${Date.now()}`;
    tx.updatedAt = new Date().toISOString();

    // Mark resource as in transaction
    const resource = db.get('resources').find((r) => r.id === tx.resourceId);
    if (resource) {
      resource.status = 'IN_TRANSACTION';
    }
  });

  recordAudit(
    req.body.actorId || 'usr-default',
    req.body.actorName || 'Seller Rep',
    'COMPANY_ADMIN',
    tx.sellerOrgId,
    'OFFER_ACCEPTED',
    'Transaction',
    tx.id,
    `Accepted transaction offer ${tx.referenceNumber}. Escrow funds secured.`,
    req
  );

  res.json(tx);
});

apiRouter.post('/transactions/:id/confirm-delivery', async (req: Request, res: Response) => {
  const { id } = req.params;
  const tx = db.get('transactions').find((t) => t.id === id);
  if (!tx) return res.status(404).json({ error: 'Transaction not found.' });

  await db.withTransaction(() => {
    tx.status = 'COMPLETED';
    tx.paymentStatus = 'RELEASED_TO_SELLER';
    tx.deliveryConfirmedAt = new Date().toISOString();
    tx.completedAt = new Date().toISOString();
    tx.updatedAt = new Date().toISOString();

    const resource = db.get('resources').find((r) => r.id === tx.resourceId);
    if (resource) {
      resource.status = 'SOLD';
    }

    const passport = db.get('passports').find((p) => p.resourceId === tx.resourceId);
    if (passport) {
      passport.history.unshift({
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventType: 'RECYCLED',
        actorName: req.body.actorName || 'Buyer Signatory',
        actorOrg: tx.buyerOrgName,
        location: 'Consignee Plant',
        notes: `Delivery finalized and escrow released ($${tx.totalAmount} ${tx.currency}). Ownership transferred to ${tx.buyerOrgName}.`,
      });
      passport.previousOwners.push(tx.sellerOrgName);
      passport.currentOwnerOrgId = tx.buyerOrgId;
    }
  });

  recordAudit(
    req.body.actorId || 'usr-default',
    req.body.actorName || 'Consignee Officer',
    'BUYER',
    tx.buyerOrgId,
    'TRANSACTION_COMPLETED',
    'Transaction',
    tx.id,
    `Confirmed receipt and completed transaction ${tx.referenceNumber}`,
    req
  );

  res.json(tx);
});

// -------------------------------------------------------------
// 7. FACILITIES & CAPACITY MARKETPLACE
// -------------------------------------------------------------
apiRouter.get('/facilities', (req: Request, res: Response) => {
  res.json(db.get('facilities'));
});

apiRouter.get('/facilities/reservations', (req: Request, res: Response) => {
  res.json(db.get('capacityReservations'));
});

apiRouter.post('/facilities/reservations', async (req: Request, res: Response) => {
  const {
    facilityId,
    reservingOrgId,
    reservedTonnes,
    startDate,
    endDate,
    actorName = 'Procurement Officer',
  } = req.body;

  const facility = db.get('facilities').find((f) => f.id === facilityId);
  const reservingOrg = db.get('organizations').find((o) => o.id === reservingOrgId);

  if (!facility || !reservingOrg) {
    return res.status(404).json({ error: 'Facility or organization not found.' });
  }

  const tonnes = Number(reservedTonnes);
  if (tonnes > facility.availableCapacityTonnesPerMonth) {
    return res.status(409).json({
      error: `Double-booking prevention: Requested capacity (${tonnes} tonnes) exceeds currently available capacity (${facility.availableCapacityTonnesPerMonth} tonnes).`,
    });
  }

  const reservationId = `cap-res-${Date.now().toString(36)}`;
  const reservation: CapacityReservation = {
    id: reservationId,
    facilityId,
    facilityName: facility.name,
    reservingOrgId,
    reservingOrgName: reservingOrg.name,
    reservedTonnes: tonnes,
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    status: 'CONFIRMED',
    agreedRatePerTonne: 115,
    currency: 'USD',
    createdAt: new Date().toISOString(),
  };

  await db.withTransaction(() => {
    facility.availableCapacityTonnesPerMonth -= tonnes;
    db.get('capacityReservations').unshift(reservation);
  });

  recordAudit(
    req.body.actorId || 'usr-default',
    actorName,
    'FACILITY_OPERATOR',
    reservingOrgId,
    'CAPACITY_RESERVED',
    'CapacityReservation',
    reservationId,
    `Reserved ${tonnes} tonnes/mo capacity at ${facility.name}`,
    req
  );

  res.status(201).json(reservation);
});

// -------------------------------------------------------------
// 8. LOGISTICS, FLEET & DRIVERS
// -------------------------------------------------------------
apiRouter.get('/logistics/vehicles', (req: Request, res: Response) => {
  res.json(db.get('vehicles'));
});

apiRouter.get('/logistics/drivers', (req: Request, res: Response) => {
  res.json(db.get('drivers'));
});

apiRouter.get('/logistics/jobs', (req: Request, res: Response) => {
  res.json(db.get('logisticsJobs'));
});

apiRouter.post('/logistics/dispatch', async (req: Request, res: Response) => {
  const {
    vehicleId,
    driverId,
    cargoDescription,
    weightTonnes = 10,
    originName,
    originLat,
    originLng,
    destinationName,
    destinationLat,
    destinationLng,
    actorName = 'Fleet Controller',
  } = req.body;

  const vehicle = db.get('vehicles').find((v) => v.id === vehicleId);
  const driver = db.get('drivers').find((d) => d.id === driverId);

  if (!vehicle) {
    return res.status(400).json({ error: 'Valid vehicle must be selected.' });
  }

  if (vehicle.currentStatus === 'ON_TRIP') {
    return res.status(409).json({
      error: `Conflict: Vehicle ${vehicle.registrationPlate} is already assigned to an active trip. Overlapping assignments are rejected.`,
    });
  }

  const oLat = Number(originLat);
  const oLng = Number(originLng);
  const dLat = Number(destinationLat);
  const dLng = Number(destinationLng);
  const coordinatesAreValid = [oLat, oLng, dLat, dLng].every(Number.isFinite)
    && Math.abs(oLat) <= 90 && Math.abs(dLat) <= 90
    && Math.abs(oLng) <= 180 && Math.abs(dLng) <= 180;
  if (!coordinatesAreValid) {
    return res.status(400).json({ error: 'Valid origin and geocoded destination coordinates are required; sample coordinates are not substituted.' });
  }
  if (!Number.isFinite(Number(weightTonnes)) || Number(weightTonnes) <= 0) {
    return res.status(400).json({ error: 'Cargo weight must be a positive number of tonnes.' });
  }
  let dist = calculateDistanceKm(oLat, oLng, dLat, dLng);
  let durationMins = Math.round(dist * 1.8);
  let routeSource: 'MAPBOX_DIRECTIONS' | 'STRAIGHT_LINE_ESTIMATE' = 'STRAIGHT_LINE_ESTIMATE';
  const mapboxToken = process.env.MAPBOX_API_KEY?.trim();

  if (mapboxToken) {
    try {
      const routeUrl = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${oLng},${oLat};${dLng},${dLat}`);
      routeUrl.searchParams.set('access_token', mapboxToken);
      routeUrl.searchParams.set('overview', 'false');
      routeUrl.searchParams.set('alternatives', 'false');
      const routeResponse = await fetch(routeUrl, { signal: AbortSignal.timeout(12_000) });
      if (!routeResponse.ok) {
        return res.status(502).json({ error: `Mapbox driving route failed (HTTP ${routeResponse.status}); dispatch was not created.` });
      }
      const routePayload = await routeResponse.json() as { routes?: Array<{ distance: number; duration: number }> };
      const route = routePayload.routes?.[0];
      if (!route) return res.status(422).json({ error: 'Mapbox could not find a drivable route; dispatch was not created.' });
      dist = route.distance / 1000;
      durationMins = Math.round(route.duration / 60);
      routeSource = 'MAPBOX_DIRECTIONS';
    } catch (error) {
      return res.status(502).json({ error: `Mapbox routing unavailable; dispatch was not created. ${error instanceof Error ? error.message : ''}` });
    }
  }

  const jobId = `job-${Date.now().toString(36)}`;
  const job: LogisticsJob = {
    id: jobId,
    trackingNumber: `RC-TRK-${Math.floor(10000 + Math.random() * 90000)}`,
    originName: originName || 'Ikeja Logistics Depot',
    originLat: oLat,
    originLng: oLng,
    destinationName: destinationName || 'Lekki Industrial Terminal',
    destinationLat: dLat,
    destinationLng: dLng,
    currentLat: oLat,
    currentLng: oLng,
    cargoDescription: cargoDescription || 'Industrial Salvage Batch',
    weightTonnes: Number(weightTonnes),
    vehicleId: vehicle.id,
    vehiclePlate: vehicle.registrationPlate,
    driverId: driver?.id,
    driverName: driver?.name || 'Assigned Driver',
    status: 'IN_TRANSIT',
    estimatedDistanceKm: dist,
    estimatedDurationMins: durationMins,
    routeSource,
    backhaulMatched: false,
    backhaulDetails: 'No live backhaul matching provider is connected; no return cargo match is asserted.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.withTransaction(() => {
    vehicle.currentStatus = 'ON_TRIP';
    if (driver) driver.status = 'ON_DUTY';
    db.get('logisticsJobs').unshift(job);
  });

  recordAudit(
    req.body.actorId || 'usr-default',
    actorName,
    'LOGISTICS_OPERATOR',
    vehicle.orgId,
    'LOGISTICS_DISPATCHED',
    'LogisticsJob',
    jobId,
    `Dispatched ${vehicle.model} (${vehicle.registrationPlate}) to ${job.destinationName}`,
    req
  );

  res.status(201).json(job);
});

apiRouter.post('/logistics/jobs/:id/pod', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { signatureName, notes, photoUrl, actorName = 'Driver' } = req.body;
  const job = db.get('logisticsJobs').find((j) => j.id === id);

  if (!job) return res.status(404).json({ error: 'Logistics job not found.' });

  const gpsLat = Number(req.body.verifiedGpsLat);
  const gpsLng = Number(req.body.verifiedGpsLng);
  const hasValidGps = Number.isFinite(gpsLat) && gpsLat >= -90 && gpsLat <= 90
    && Number.isFinite(gpsLng) && gpsLng >= -180 && gpsLng <= 180;

  await db.withTransaction(() => {
    job.status = 'DELIVERED';
    job.proofOfDelivery = {
      signatureName: signatureName || 'Authorized Receiver',
      photoUrl: typeof photoUrl === 'string' && photoUrl.trim() ? photoUrl.trim() : undefined,
      deliveredAt: new Date().toISOString(),
      ...(hasValidGps ? { verifiedGpsLat: gpsLat, verifiedGpsLng: gpsLng } : {}),
      notes: notes || 'Consignee sign-off submitted; not independently verified by RECYCLN.',
    };
    job.updatedAt = new Date().toISOString();

    const vehicle = db.get('vehicles').find((v) => v.id === job.vehicleId);
    if (vehicle) {
      vehicle.currentStatus = 'AVAILABLE';
      // No telematics feed is connected; keep the vehicle's last reported GPS position unchanged.
    }
  });

  recordAudit(
    req.body.actorId || 'usr-driver-1',
    actorName,
    'DRIVER',
    'org-swifttrans',
    'PROOF_OF_DELIVERY_SUBMITTED',
    'LogisticsJob',
    job.id,
    `Submitted Proof of Delivery for tracking ${job.trackingNumber}`,
    req
  );

  res.json(job);
});

// -------------------------------------------------------------
// 9. INFRASTRUCTURE INTELLIGENCE
// -------------------------------------------------------------
apiRouter.get('/infrastructure', (req: Request, res: Response) => {
  res.json(db.get('infrastructureReports'));
});

apiRouter.post('/infrastructure', async (req: Request, res: Response) => {
  const {
    reporterUserId = 'usr-gov-agent',
    reporterName = 'Inspector',
    reporterOrgName = 'City Works',
    title,
    category,
    severity = 'HIGH',
    description,
    locationName,
    lat,
    lng,
    imageUrl,
  } = req.body;

  if (!title || !category || !description) {
    return res.status(400).json({ error: 'Title, category, and description are required.' });
  }

  const reportId = `inf-rep-${Date.now().toString(36)}`;
  const report: InfrastructureReport = {
    id: reportId,
    reporterUserId,
    reporterName,
    reporterOrgName,
    title,
    category,
    severity,
    status: 'REPORTED',
    description,
    locationName: locationName || 'Metropolitan Corridor',
    lat: Number(lat) || 6.5244,
    lng: Number(lng) || 3.3792,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80',
    humanVerified: false,
    estimatedResolutionDays: severity === 'CRITICAL' ? 2 : 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.withTransaction(() => {
    db.get('infrastructureReports').unshift(report);
  });

  recordAudit(
    reporterUserId,
    reporterName,
    'FIELD_AGENT',
    'org-metro-infra',
    'INFRASTRUCTURE_REPORT_CREATED',
    'InfrastructureReport',
    reportId,
    `Logged ${severity} issue: ${title}`,
    req
  );

  res.status(201).json(report);
});

apiRouter.post('/infrastructure/:id/triage', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, assignedDepartment, verifiedBy = 'Supervisor' } = req.body;
  const report = db.get('infrastructureReports').find((r) => r.id === id);

  if (!report) return res.status(404).json({ error: 'Report not found.' });

  await db.withTransaction(() => {
    report.status = status || 'VERIFIED';
    report.humanVerified = true;
    report.verifiedBy = verifiedBy;
    if (assignedDepartment) report.assignedDepartment = assignedDepartment;
    report.updatedAt = new Date().toISOString();
  });

  res.json(report);
});

// -------------------------------------------------------------
// 10. SATELLITE INTELLIGENCE
// -------------------------------------------------------------
apiRouter.get('/satellite/scan-status', async (req: Request, res: Response) => {
  res.json(await getSatelliteScanStatus());
});

apiRouter.post('/maps/geocode', async (req: Request, res: Response) => {
  const query = typeof req.body?.query === 'string' ? req.body.query.trim().slice(0, 200) : '';
  const token = process.env.MAPBOX_API_KEY?.trim();
  if (!query) return res.status(400).json({ error: 'A search query is required.' });
  if (!token) return res.status(503).json({ error: 'MAPBOX_API_KEY is missing on the server.' });

  try {
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
    url.searchParams.set('access_token', token);
    url.searchParams.set('country', 'ng');
    url.searchParams.set('limit', '5');
    url.searchParams.set('types', 'address,poi,locality,neighborhood,place');
    const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!response.ok) return res.status(502).json({ error: `Mapbox geocoding failed (HTTP ${response.status}).` });
    const payload = await response.json() as { features?: Array<{ id: string; place_name: string; center: [number, number]; relevance?: number }> };
    res.json((payload.features || []).map((feature) => ({
      id: feature.id,
      label: feature.place_name,
      lng: feature.center[0],
      lat: feature.center[1],
      relevance: feature.relevance,
    })));
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Mapbox geocoding request failed.' });
  }
});

apiRouter.post('/satellite/field-report', async (req: Request, res: Response) => {
  const { targetArea, lat, lng, reporterName, reporterOrgName, candidateNotes } = req.body || {};
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (typeof targetArea !== 'string' || targetArea.trim().length < 4) {
    return res.status(400).json({ error: 'Describe the observed site (at least 4 characters).' });
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Valid latitude and longitude are required. Select the exact location on the map.' });
  }

  const reportedAt = new Date().toISOString();
  const detection: import('../../src/types/index.ts').SatelliteDetection = {
    id: `field-site-${Date.now().toString(36)}`,
    sourceSatellite: 'Field Report',
    targetArea: targetArea.trim().slice(0, 160),
    lat: latitude,
    lng: longitude,
    detectionType: 'ILLEGAL_DUMP_CANDIDATE',
    confidenceScore: 0,
    status: 'UNVERIFIED_CANDIDATE',
    imageryDate: reportedAt.slice(0, 10),
    changeAreaSqm: 0,
    detectionSource: 'FIELD_REPORTED',
    reporterName: typeof reporterName === 'string' ? reporterName.trim().slice(0, 100) : undefined,
    reporterOrgName: typeof reporterOrgName === 'string' ? reporterOrgName.trim().slice(0, 140) : undefined,
    reportedAt,
    candidateNotes: typeof candidateNotes === 'string' && candidateNotes.trim()
      ? candidateNotes.trim().slice(0, 1200)
      : 'User-submitted field observation. This report has not been independently verified.',
    bounds: { north: latitude, south: latitude, east: longitude, west: longitude },
  };

  db.get('satelliteDetections').unshift(detection);
  db.persist();
  res.status(201).json(detection);
});

apiRouter.post('/satellite/scan', async (req: Request, res: Response) => {
  const { regionId } = req.body as { regionId?: string };
  if (!regionId) return res.status(400).json({ error: 'regionId is required.' });

  try {
    const result = await scanSatelliteRegion(regionId);
    res.json(result);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Satellite screening failed.';
    const status = /not set in the server environment|GEMINI_API_KEY is required/i.test(message) ? 503 : 502;
    res.status(status).json({ error: 'Live satellite screening failed.', message });
  }
});

apiRouter.get('/satellite', (req: Request, res: Response) => {
  res.json(db.get('satelliteDetections').filter((detection) => detection.detectionSource !== 'SEEDED_DEMO'));
});

// -------------------------------------------------------------
// 11. AI OPERATIONS COPILOT
// -------------------------------------------------------------
apiRouter.post('/copilot/chat', async (req: Request, res: Response) => {
  const { query, mode = 'OPERATIONS', userRole = 'COMPANY_ADMIN', userOrgId = 'org-apex' } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query text is required.' });
  }

  try {
    const response = await processCopilotMessage(query, userRole, userOrgId, mode);
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: 'Copilot failed to process request', message: err.message });
  }
});

// -------------------------------------------------------------
// 12. INTEGRATIONS & DEVELOPER PLATFORM
// -------------------------------------------------------------
apiRouter.get('/integrations', (req: Request, res: Response) => {
  const list = getIntegrationsList();
  res.json(list);
});

apiRouter.post('/integrations/test', async (req: Request, res: Response) => {
  const { keyName } = req.body;
  if (!keyName) return res.status(400).json({ error: 'keyName is required.' });
  const result = await testProviderConnection(keyName);
  res.json(result);
});

apiRouter.post('/integrations/key', (req: Request, res: Response) => {
  const { keyName, keyValue } = req.body;
  if (!keyName || !keyValue) {
    return res.status(400).json({ error: 'Both keyName and keyValue are required.' });
  }
  saveIntegrationKey(keyName, keyValue);
  res.json({ success: true, message: `Key for ${keyName} saved securely.` });
});

// -------------------------------------------------------------
// 13. AUDIT LOGS & ENVIRONMENTAL ANALYTICS
// -------------------------------------------------------------
apiRouter.get('/audit', (req: Request, res: Response) => {
  res.json(db.get('auditLogs'));
});

apiRouter.get('/analytics/environmental', (req: Request, res: Response) => {
  const resources = db.get('resources');
  const passports = db.get('passports');

  const totalQuantity = resources.reduce((acc, r) => acc + r.quantity, 0);
  const totalCo2Avoided = passports.reduce((acc, p) => acc + p.carbonOffsetKg, 0);

  res.json({
    materialDivertedTonnes: Math.round(totalQuantity * 10) / 10,
    co2AvoidedKg: totalCo2Avoided,
    waterPreservedLiters: Math.round(totalQuantity * 45000),
    virginMaterialSavedTonnes: Math.round(totalQuantity * 0.92 * 10) / 10,
    tag: 'Calculated' as const,
  });
});
