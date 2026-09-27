export type UserRole =
  | 'USER'
  | 'COMPANY_ADMIN'
  | 'EMPLOYEE'
  | 'BUYER'
  | 'SUPPLIER'
  | 'FACILITY_OPERATOR'
  | 'DRIVER'
  | 'LOGISTICS_OPERATOR'
  | 'FIELD_AGENT'
  | 'GOVERNMENT_OPERATOR'
  | 'PLATFORM_ADMIN';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  orgId: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  category: 'RECYCLER' | 'MANUFACTURER' | 'LOGISTICS' | 'WASTE_AGGREGATOR' | 'MUNICIPALITY' | 'ENTERPRISE';
  registrationNumber: string;
  verificationStatus: VerificationStatus;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  contactEmail: string;
  contactPhone: string;
  trustScore: number;
  products?: string[];
  monthlyCapacityTonnes?: number;
  fleetCapability?: {
    totalTrucks: number;
    types: string[];
    maxRadiusKm: number;
  };
  historicalFulfillment?: {
    fulfillmentRatePct: number;
    onTimeDeliveryPct: number;
    completedOrdersCount: number;
    rating: number;
  };
  pricingTiers?: {
    tierName: string;
    minVolumeTonnes: number;
    maxVolumeTonnes: number;
    discountPercent: number;
  }[];
  createdAt: string;
}

export type ResourceStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_TRANSACTION'
  | 'IN_TRANSIT'
  | 'AT_FACILITY'
  | 'SOLD'
  | 'TRANSFERRED'
  | 'RECOVERED'
  | 'RECYCLED'
  | 'DISPOSED'
  | 'ARCHIVED';

export type ResourceCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'REFURBISHABLE' | 'SCRAP';

export interface Resource {
  id: string;
  orgId: string;
  orgName?: string;
  name: string;
  category: string;
  materialType: string;
  description: string;
  quantity: number;
  unit: 'tonnes' | 'kg' | 'units' | 'm³';
  locationName: string;
  lat: number;
  lng: number;
  condition: ResourceCondition;
  estimatedValue: number;
  currency: string;
  availabilityDate: string;
  status: ResourceStatus;
  origin: string;
  qrCodeId: string;
  passportId: string;
  images: string[];
  attributes?: Record<string, string | number>;
  createdAt: string;
  updatedAt: string;
}

export interface PassportEvent {
  id: string;
  timestamp: string;
  eventType: 'CREATED' | 'SCANNED' | 'TESTED' | 'VALUED' | 'TRANSFERRED' | 'PROCESSED' | 'DISPATCHED' | 'RECYCLED';
  actorName: string;
  actorOrg: string;
  location: string;
  notes: string;
  metadata?: Record<string, any>;
}

export interface ResourcePassport {
  id: string;
  resourceId: string;
  batchCode: string;
  digitalFingerprint: string;
  materialPurity: number; // 0-100%
  carbonOffsetKg: number;
  circularityScore: number; // 0-100%
  provenance: string;
  currentOwnerOrgId: string;
  previousOwners: string[];
  history: PassportEvent[];
  recommendedRecoveryPathway: 'DIRECT_REUSE' | 'REFURBISHMENT' | 'SMELTING' | 'CHEMICAL_RECYCLING' | 'REMANUFACTURING';
  createdAt: string;
}

export interface Warehouse {
  id: string;
  orgId: string;
  name: string;
  code: string;
  address: string;
  lat: number;
  lng: number;
  capacityTonnes: number;
  currentOccupancyTonnes: number;
  managerName: string;
  contactPhone: string;
}

export interface StockMovement {
  id: string;
  resourceId: string;
  resourceName: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  quantity: number;
  unit: string;
  performedByUserId: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  timestamp: string;
  reason: string;
}

export type ListingType = 'SELL' | 'BUY_WANTED' | 'EXCHANGE' | 'REALLOCATE' | 'DONATE';

export interface Listing {
  id: string;
  orgId: string;
  orgName: string;
  resourceId?: string;
  resource?: Resource;
  title: string;
  listingType: ListingType;
  category: string;
  materialType: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  currency: string;
  minimumOrderQuantity: number;
  locationName: string;
  lat: number;
  lng: number;
  condition: ResourceCondition;
  terms: string;
  status: 'ACTIVE' | 'PENDING' | 'CLOSED';
  exchangeWantedMaterial?: string;
  createdAt: string;
}

export interface WantedRequest {
  id: string;
  orgId: string;
  orgName: string;
  materialType: string;
  desiredQuantity: number;
  unit: string;
  maxDistanceKm: number;
  targetLat: number;
  targetLng: number;
  targetLocation: string;
  maxPricePerUnit: number;
  currency: string;
  deadline: string;
  status: 'OPEN' | 'MATCHED' | 'FULFILLED' | 'CANCELLED';
  createdAt: string;
}

export interface MatchScore {
  listingId: string;
  listing: Listing;
  compatibilityScore: number; // 0-100%
  materialMatch: boolean;
  distanceKm: number;
  quantityFulfillmentPercent: number;
  conditionFit: boolean;
  explanation: string;
}

export type TransactionStatus =
  | 'OFFER'
  | 'ACCEPTED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'PICKUP_SCHEDULED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface Transaction {
  id: string;
  referenceNumber: string;
  listingId: string;
  listingTitle: string;
  sellerOrgId: string;
  sellerOrgName: string;
  buyerOrgId: string;
  buyerOrgName: string;
  resourceId: string;
  quantity: number;
  unit: string;
  totalAmount: number;
  currency: string;
  transactionType: ListingType;
  exchangeResourceId?: string;
  status: TransactionStatus;
  paymentStatus: 'UNPAID' | 'ESCROW_HELD' | 'RELEASED_TO_SELLER' | 'REFUNDED';
  paymentProvider?: string;
  paymentReference?: string;
  logisticsJobId?: string;
  deliveryConfirmedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Facility {
  id: string;
  orgId: string;
  name: string;
  facilityType: 'RECYCLING_PLANT' | 'WAREHOUSE' | 'PROCESSING_PLANT' | 'MANUFACTURER' | 'REFURBISHMENT_FACILITY' | 'STORAGE';
  acceptedMaterials: string[];
  totalCapacityTonnesPerMonth: number;
  availableCapacityTonnesPerMonth: number;
  address: string;
  city: string;
  lat: number;
  lng: number;
  operatingHours: string;
  certificationStatus: string;
  equipment: string[];
  contactEmail: string;
  contactPhone: string;
}

export interface CapacityReservation {
  id: string;
  facilityId: string;
  facilityName: string;
  reservingOrgId: string;
  reservingOrgName: string;
  reservedTonnes: number;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'FULFILLED' | 'CANCELLED';
  agreedRatePerTonne: number;
  currency: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  orgId: string;
  registrationPlate: string;
  model: string;
  type: 'HEAVY_TRUCK' | 'FLATBED' | 'VAN' | 'COMPACTOR' | 'TIPPER';
  capacityKg: number;
  currentLat: number;
  currentLng: number;
  locationName: string;
  fuelType: 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'CNG';
  currentStatus: 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE';
  assignedDriverId?: string;
  assignedDriverName?: string;
  lastInspectionDate: string;
}

export interface Driver {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  status: 'AVAILABLE' | 'ON_DUTY' | 'RESTING';
  assignedVehicleId?: string;
  assignedVehiclePlate?: string;
  rating: number;
  completedTrips: number;
}

export type LogisticsJobStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'EN_ROUTE_TO_PICKUP'
  | 'ARRIVED_PICKUP'
  | 'LOADED'
  | 'IN_TRANSIT'
  | 'ARRIVED_DESTINATION'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface LogisticsJob {
  id: string;
  transactionId?: string;
  trackingNumber: string;
  originName: string;
  originLat: number;
  originLng: number;
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  currentLat: number;
  currentLng: number;
  cargoDescription: string;
  weightTonnes: number;
  vehicleId?: string;
  vehiclePlate?: string;
  driverId?: string;
  driverName?: string;
  status: LogisticsJobStatus;
  estimatedDistanceKm: number;
  estimatedDurationMins: number;
  backhaulMatched?: boolean;
  backhaulDetails?: string;
  proofOfDelivery?: {
    signatureName: string;
    photoUrl?: string;
    deliveredAt: string;
    verifiedGpsLat: number;
    verifiedGpsLng: number;
    notes: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InfrastructureReport {
  id: string;
  reporterUserId: string;
  reporterName: string;
  reporterOrgName: string;
  title: string;
  category: 'ROAD_DAMAGE' | 'ILLEGAL_DUMPSITE' | 'DRAINAGE_BLOCKAGE' | 'BROKEN_LIGHTING' | 'WATER_INFRASTRUCTURE' | 'HAZARDOUS_ACCUMULATION';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'REPORTED' | 'VERIFIED' | 'ASSIGNED' | 'IN_REPAIR' | 'RESOLVED' | 'DISMISSED';
  description: string;
  locationName: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  assignedDepartment?: string;
  humanVerified: boolean;
  verifiedBy?: string;
  estimatedResolutionDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface SatelliteDetection {
  id: string;
  sourceSatellite: 'Sentinel-2' | 'Landsat-9' | 'Copernicus-DEM' | 'Commercial-SAR';
  targetArea: string;
  lat: number;
  lng: number;
  detectionType: 'ILLEGAL_DUMP_CANDIDATE' | 'LANDFILL_VOLUME_EXPANSION' | 'SCRAP_METAL_ACCUMULATION' | 'INDUSTRIAL_STOCKPILE_DEPLETION';
  confidenceScore: number; // 0-100%
  status: 'UNVERIFIED_CANDIDATE' | 'GROUND_VERIFIED' | 'FALSE_POSITIVE' | 'ACTIONED';
  imageryDate: string;
  changeAreaSqm: number;
  groundInspectionId?: string;
  candidateNotes: string;
  bounds: { north: number; south: number; east: number; west: number };
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
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

export interface IntegrationStatus {
  category: string;
  name: string;
  keyName: string;
  isConfigured: boolean;
  isCustomKeySet: boolean;
  status: 'CONFIGURED' | 'NOT_CONFIGURED' | 'ERROR';
  lastChecked?: string;
  lastErrorMessage?: string;
  description: string;
  documentationUrl: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  orgId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
}

export interface EnvironmentalMetric {
  materialDivertedTonnes: number;
  co2AvoidedKg: number;
  waterPreservedLiters: number;
  virginMaterialSavedTonnes: number;
  tag: 'Calculated' | 'Estimated' | 'Reported';
}

export interface OperationalException {
  id: string;
  orgId: string;
  type:
    | 'VEHICLE_DELAYED'
    | 'DRIVER_UNAVAILABLE'
    | 'ROUTE_DISRUPTION'
    | 'SUPPLIER_UNCONFIRMED'
    | 'DELIVERY_DEADLINE_RISK'
    | 'CAPACITY_EXCEEDED'
    | 'FACILITY_UNAVAILABLE'
    | 'PAYMENT_PENDING'
    | 'INVENTORY_STOCKOUT_RISK';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  title: string;
  description: string;
  impact: string;
  recommendedAction: {
    label: string;
    actionType: string;
    payload?: any;
  };
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  resolvedAt?: string;
  createdAt: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  orgId: string;
  title: string;
  materialType: string;
  maxDistanceKm: number;
  maxPricePerUnit: number;
  notifyInApp: boolean;
  matchCount?: number;
  createdAt: string;
}

export interface CorporateContract {
  id: string;
  buyerOrgId: string;
  supplierOrgId: string;
  supplierName: string;
  materialType: string;
  agreedRatePerUnit: number;
  currency: string;
  minimumOrderQuantity: number;
  validUntil: string;
}

export interface ProcurementAnalysis {
  parsedCriteria: {
    material: string;
    quantity: number;
    unit: string;
    location: string;
    maxDays: number;
    condition: string;
  };
  options: Array<{
    supplierId: string;
    supplierName: string;
    verified: boolean;
    trustScore: number;
    availableQuantity: number;
    unit: string;
    basePricePerUnit: number;
    effectivePricePerUnit: number;
    totalPrice: number;
    currency: string;
    pricingTierApplied: string;
    distanceKm: number;
    estimatedDeliveryDays: number;
    logisticsCost: number;
    inventorySource: 'PUBLIC_MARKETPLACE' | 'PRIVATE_INVENTORY' | 'VERIFIED_SUPPLIER_BUFFER';
    recommended: boolean;
    fulfillmentRatePct: number;
  }>;
  aiSummary: string;
}

