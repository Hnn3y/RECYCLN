import fs from 'fs';
import path from 'path';
import type {
  User,
  Organization,
  Resource,
  ResourcePassport,
  Warehouse,
  StockMovement,
  Listing,
  WantedRequest,
  Transaction,
  Facility,
  CapacityReservation,
  Vehicle,
  Driver,
  LogisticsJob,
  InfrastructureReport,
  SatelliteDetection,
  IntegrationStatus,
} from '../../src/types/index.ts';

import type { AuditLog } from '../../src/types/index.ts';

export interface DatabaseSchema {
  users: User[];
  organizations: Organization[];
  resources: Resource[];
  passports: ResourcePassport[];
  warehouses: Warehouse[];
  stockMovements: StockMovement[];
  listings: Listing[];
  wantedRequests: WantedRequest[];
  transactions: Transaction[];
  facilities: Facility[];
  capacityReservations: CapacityReservation[];
  vehicles: Vehicle[];
  drivers: Driver[];
  logisticsJobs: LogisticsJob[];
  infrastructureReports: InfrastructureReport[];
  satelliteDetections: SatelliteDetection[];
  auditLogs: AuditLog[];
  integrationSettings: Record<string, string>; // masked or stored runtime keys
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'recycln.db.json');

export class DatabaseStore {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;
  private lockPromise: Promise<void> = Promise.resolve();

  constructor() {
    this.data = this.loadOrSeed();
  }

  public async withTransaction<T>(action: () => Promise<T> | T): Promise<T> {
    let releaseLock: () => void;
    const currentLock = this.lockPromise;
    this.lockPromise = new Promise((resolve) => {
      releaseLock = resolve;
    });

    await currentLock;
    try {
      const result = await action();
      this.persist();
      return result;
    } finally {
      releaseLock!();
    }
  }

  public get<K extends keyof DatabaseSchema>(table: K): DatabaseSchema[K] {
    return this.data[table];
  }

  public persist(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
      } catch (err) {
        console.error('Failed to persist database to disk:', err);
      }
    }, 150);
  }

  private loadOrSeed(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(content);
        if (parsed.organizations && parsed.resources) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read existing database file, initializing clean seed dataset.', e);
    }
    return this.createSeedData();
  }

  private createSeedData(): DatabaseSchema {
    const orgs: Organization[] = [
      {
        id: 'org-apex',
        name: 'Apex Circular Metals Ltd',
        code: 'APEX',
        category: 'RECYCLER',
        registrationNumber: 'RC-1849204',
        verificationStatus: 'VERIFIED',
        address: 'Plot 14, Ikeja Industrial Estate',
        city: 'Lagos',
        country: 'Nigeria',
        lat: 6.6018,
        lng: 3.3515,
        contactEmail: 'operations@apexmetals.ng',
        contactPhone: '+234 1 892 4001',
        trustScore: 98,
        createdAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'org-ecovanguard',
        name: 'Ecovanguard Polymers & Flakes',
        code: 'ECOV',
        category: 'WASTE_AGGREGATOR',
        registrationNumber: 'RC-2049182',
        verificationStatus: 'VERIFIED',
        address: 'KM 24 Lekki-Epe Expressway, Sangotedo',
        city: 'Lagos',
        country: 'Nigeria',
        lat: 6.4698,
        lng: 3.6190,
        contactEmail: 'contact@ecovanguard.org',
        contactPhone: '+234 1 774 2200',
        trustScore: 94,
        createdAt: '2026-02-01T09:30:00.000Z',
      },
      {
        id: 'org-swifttrans',
        name: 'SwiftTrans Heavy Fleet & Haulage',
        code: 'SWIFT',
        category: 'LOGISTICS',
        registrationNumber: 'RC-1192837',
        verificationStatus: 'VERIFIED',
        address: 'Wharf Road, Apapa Port Terminal Gate 3',
        city: 'Lagos',
        country: 'Nigeria',
        lat: 6.4474,
        lng: 3.3644,
        contactEmail: 'dispatch@swifttrans.com',
        contactPhone: '+234 1 902 3344',
        trustScore: 96,
        createdAt: '2026-01-15T11:00:00.000Z',
      },
      {
        id: 'org-metro-infra',
        name: 'State Waste Management & Infrastructure Dept',
        code: 'LAWMA',
        category: 'MUNICIPALITY',
        registrationNumber: 'GOV-LAG-009',
        verificationStatus: 'VERIFIED',
        address: 'State Secretariat Complex, Alausa',
        city: 'Ikeja, Lagos',
        country: 'Nigeria',
        lat: 6.6186,
        lng: 3.3601,
        contactEmail: 'triage@lawma.gov.ng',
        contactPhone: '+234 1 0800-WASTE',
        trustScore: 100,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'org-greenbuild',
        name: 'GreenBuild Demolition & Remediation',
        code: 'GBUILD',
        category: 'ENTERPRISE',
        registrationNumber: 'RC-3920194',
        verificationStatus: 'VERIFIED',
        address: 'Victoria Island Commercial Corridor',
        city: 'Lagos',
        country: 'Nigeria',
        lat: 6.4281,
        lng: 3.4219,
        contactEmail: 'salvage@greenbuild.ng',
        contactPhone: '+234 1 445 9900',
        trustScore: 92,
        createdAt: '2026-03-01T10:00:00.000Z',
      },
    ];

    const users: User[] = [
      {
        id: 'usr-admin',
        name: 'Alex Oladipo',
        email: 'admin@recycln.os',
        role: 'PLATFORM_ADMIN',
        orgId: 'org-apex',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'usr-apex-mgr',
        name: 'Fatima Ibrahim',
        email: 'fatima@apexmetals.ng',
        role: 'COMPANY_ADMIN',
        orgId: 'org-apex',
        createdAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'usr-eco-buyer',
        name: 'Chidi Okafor',
        email: 'chidi@ecovanguard.org',
        role: 'BUYER',
        orgId: 'org-ecovanguard',
        createdAt: '2026-02-01T09:30:00.000Z',
      },
      {
        id: 'usr-swift-disp',
        name: 'Tunde Bakare',
        email: 'tunde@swifttrans.com',
        role: 'LOGISTICS_OPERATOR',
        orgId: 'org-swifttrans',
        createdAt: '2026-01-15T11:00:00.000Z',
      },
      {
        id: 'usr-driver-1',
        name: 'Emeka Nwosu',
        email: 'emeka.driver@swifttrans.com',
        role: 'DRIVER',
        orgId: 'org-swifttrans',
        createdAt: '2026-01-20T14:00:00.000Z',
      },
      {
        id: 'usr-gov-agent',
        name: 'Engr. Yemi Adeleke',
        email: 'yemi@lawma.gov.ng',
        role: 'GOVERNMENT_OPERATOR',
        orgId: 'org-metro-infra',
        createdAt: '2026-01-05T09:00:00.000Z',
      },
      {
        id: 'usr-field-insp',
        name: 'Kemi Balogun',
        email: 'kemi.field@recycln.os',
        role: 'FIELD_AGENT',
        orgId: 'org-metro-infra',
        createdAt: '2026-02-10T10:00:00.000Z',
      },
    ];

    const resources: Resource[] = [
      {
        id: 'res-al-6063',
        orgId: 'org-apex',
        orgName: 'Apex Circular Metals Ltd',
        name: 'Extruded Aluminium Scrap 6063 Alloy',
        category: 'Non-Ferrous Metals',
        materialType: 'Aluminium 6063',
        description: 'Clean architectural extrusions, de-anodized and cut into 1.2m lengths. Free of zinc and iron contaminants.',
        quantity: 12.5,
        unit: 'tonnes',
        locationName: 'Apex Yard 2, Ikeja Industrial Park',
        lat: 6.6025,
        lng: 3.3522,
        condition: 'GOOD',
        estimatedValue: 26250,
        currency: 'USD',
        availabilityDate: '2026-09-28',
        status: 'AVAILABLE',
        origin: 'Demolished Commercial Bank Tower, Marina',
        qrCodeId: 'QR-RES-AL-6063-X9',
        passportId: 'PASSPORT-AL-901',
        images: [
          'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80',
        ],
        createdAt: '2026-09-20T10:15:00.000Z',
        updatedAt: '2026-09-26T14:20:00.000Z',
      },
      {
        id: 'res-pet-bales',
        orgId: 'org-ecovanguard',
        orgName: 'Ecovanguard Polymers & Flakes',
        name: 'Baled Post-Consumer Clear PET Bottles',
        category: 'Plastics & Polymers',
        materialType: 'rPET (Polyethylene Terephthalate)',
        description: 'Hot-washed pre-sorted clear beverage containers, high density compacted bales with wire straps.',
        quantity: 28.0,
        unit: 'tonnes',
        locationName: 'Sangotedo Material Recovery Facility',
        lat: 6.4695,
        lng: 3.6185,
        condition: 'EXCELLENT',
        estimatedValue: 14560,
        currency: 'USD',
        availabilityDate: '2026-09-27',
        status: 'AVAILABLE',
        origin: 'Coastal & Municipal Plastic Cleanup Schemes',
        qrCodeId: 'QR-RES-PET-28T',
        passportId: 'PASSPORT-PET-441',
        images: [
          'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
        ],
        createdAt: '2026-09-22T08:40:00.000Z',
        updatedAt: '2026-09-25T11:00:00.000Z',
      },
      {
        id: 'res-steel-rebar',
        orgId: 'org-greenbuild',
        orgName: 'GreenBuild Demolition & Remediation',
        name: 'Salvaged Structural Steel Beams & Rebar',
        category: 'Ferrous Metals',
        materialType: 'Mild Structural Steel S275',
        description: 'Heavy structural I-beams and cleaned de-concreted rebar sections, tested for tensile load integrity.',
        quantity: 45.0,
        unit: 'tonnes',
        locationName: 'Victoria Island Demolition Staging Zone',
        lat: 6.4290,
        lng: 3.4210,
        condition: 'GOOD',
        estimatedValue: 24750,
        currency: 'USD',
        availabilityDate: '2026-09-29',
        status: 'IN_TRANSACTION',
        origin: 'Industrial Warehouse Retrofit Site',
        qrCodeId: 'QR-RES-STEEL-45T',
        passportId: 'PASSPORT-STL-102',
        images: [
          'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
        ],
        createdAt: '2026-09-18T16:00:00.000Z',
        updatedAt: '2026-09-26T17:30:00.000Z',
      },
      {
        id: 'res-cu-transformer',
        orgId: 'org-apex',
        orgName: 'Apex Circular Metals Ltd',
        name: 'Heavy Industrial Copper Windings & Busbars',
        category: 'High-Value Electrical Scrap',
        materialType: 'Electrolytic Copper (Cu-ETP 99.9%)',
        description: 'Decommissioned step-down substation transformer coils. High purity electrolytic copper scrap.',
        quantity: 6.2,
        unit: 'tonnes',
        locationName: 'Apex Yard 2, Ikeja Industrial Park',
        lat: 6.6025,
        lng: 3.3522,
        condition: 'EXCELLENT',
        estimatedValue: 53940,
        currency: 'USD',
        availabilityDate: '2026-09-30',
        status: 'AVAILABLE',
        origin: 'Grid Substation Modernization Project',
        qrCodeId: 'QR-RES-CU-6200',
        passportId: 'PASSPORT-CU-889',
        images: [
          'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80',
        ],
        createdAt: '2026-09-24T12:00:00.000Z',
        updatedAt: '2026-09-26T09:00:00.000Z',
      },
    ];

    const passports: ResourcePassport[] = [
      {
        id: 'PASSPORT-AL-901',
        resourceId: 'res-al-6063',
        batchCode: 'BATCH-2026-AL-0901',
        digitalFingerprint: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        materialPurity: 97.8,
        carbonOffsetKg: 106250, // avoided bauxite mining & smelting
        circularityScore: 94,
        provenance: 'Demolished Commercial Bank Tower, Broad Street, Marina, Lagos',
        currentOwnerOrgId: 'org-apex',
        previousOwners: ['Marina Properties PLC', 'GreenBuild Demolition & Remediation'],
        recommendedRecoveryPathway: 'SMELTING',
        createdAt: '2026-09-20T10:15:00.000Z',
        history: [
          {
            id: 'evt-1',
            timestamp: '2026-09-20T10:15:00.000Z',
            eventType: 'CREATED',
            actorName: 'Fatima Ibrahim',
            actorOrg: 'Apex Circular Metals Ltd',
            location: 'Ikeja Yard 2',
            notes: 'Batch initial intake from Marina site salvage.',
          },
          {
            id: 'evt-2',
            timestamp: '2026-09-21T14:30:00.000Z',
            eventType: 'TESTED',
            actorName: 'Engr. D. Adeleke',
            actorOrg: 'Materials Verification Council',
            location: 'Quality Testing Lab',
            notes: 'XRF Spectrometry confirmed 97.8% 6063 alloy purity with negligible ferrous trace.',
          },
          {
            id: 'evt-3',
            timestamp: '2026-09-22T09:00:00.000Z',
            eventType: 'VALUED',
            actorName: 'RECYCLN AI Valuation Engine',
            actorOrg: 'System',
            location: 'Server-Side Engine',
            notes: 'Assessed at $2,100/tonne based on LME spot index and regional smelting demand.',
          },
        ],
      },
      {
        id: 'PASSPORT-PET-441',
        resourceId: 'res-pet-bales',
        batchCode: 'BATCH-2026-PET-0441',
        digitalFingerprint: 'sha256:3a4b910e5c1287e028b12204c66dbb718902cae1104e112d7c00184bba0209ab',
        materialPurity: 96.2,
        carbonOffsetKg: 42000,
        circularityScore: 91,
        provenance: 'Aggregated from 14 coastal recovery hubs across Eti-Osa LGA',
        currentOwnerOrgId: 'org-ecovanguard',
        previousOwners: ['Lekki Coastal Cleanup Network'],
        recommendedRecoveryPathway: 'CHEMICAL_RECYCLING',
        createdAt: '2026-09-22T08:40:00.000Z',
        history: [
          {
            id: 'evt-10',
            timestamp: '2026-09-22T08:40:00.000Z',
            eventType: 'CREATED',
            actorName: 'Chidi Okafor',
            actorOrg: 'Ecovanguard Polymers & Flakes',
            location: 'Sangotedo MRF',
            notes: 'Baled and compacted following optical sorting.',
          },
        ],
      },
    ];

    const warehouses: Warehouse[] = [
      {
        id: 'wh-ikeja-1',
        orgId: 'org-apex',
        name: 'Apex Central Metals Depot',
        code: 'WH-IKJ-01',
        address: 'Plot 14, Industrial Avenue, Ikeja',
        lat: 6.6018,
        lng: 3.3515,
        capacityTonnes: 1500,
        currentOccupancyTonnes: 620,
        managerName: 'Rasheed Alabi',
        contactPhone: '+234 1 892 4005',
      },
      {
        id: 'wh-sangotedo-1',
        orgId: 'org-ecovanguard',
        name: 'Ecovanguard Regional Sorting Depot',
        code: 'WH-SNG-01',
        address: 'KM 24 Lekki-Epe Expressway',
        lat: 6.4698,
        lng: 3.6190,
        capacityTonnes: 800,
        currentOccupancyTonnes: 340,
        managerName: 'Grace Eze',
        contactPhone: '+234 1 774 2205',
      },
    ];

    const stockMovements: StockMovement[] = [
      {
        id: 'sm-001',
        resourceId: 'res-al-6063',
        resourceName: 'Extruded Aluminium Scrap 6063 Alloy',
        fromWarehouseId: 'wh-ikeja-1',
        fromWarehouseName: 'Apex Central Metals Depot',
        toWarehouseId: 'wh-sangotedo-1',
        toWarehouseName: 'Ecovanguard Regional Sorting Depot',
        quantity: 2.5,
        unit: 'tonnes',
        performedByUserId: 'usr-apex-mgr',
        status: 'COMPLETED',
        timestamp: '2026-09-25T11:00:00.000Z',
        reason: 'Consignment transfer for secondary ultrasonic cleaning and sorting.',
      },
    ];

    const listings: Listing[] = [
      {
        id: 'list-001',
        orgId: 'org-apex',
        orgName: 'Apex Circular Metals Ltd',
        resourceId: 'res-al-6063',
        resource: resources[0],
        title: '12.5 Tonnes Architectural 6063 Aluminium Extrusions',
        listingType: 'SELL',
        category: 'Non-Ferrous Metals',
        materialType: 'Aluminium 6063',
        quantity: 12.5,
        unit: 'tonnes',
        pricePerUnit: 2100,
        currency: 'USD',
        minimumOrderQuantity: 2.0,
        locationName: 'Ikeja Industrial Zone, Lagos',
        lat: 6.6025,
        lng: 3.3522,
        condition: 'GOOD',
        terms: 'FOB Apex Yard or arranged haulage via RECYCLN Logistics Network. 100% Escrow release on weight bridge verification.',
        status: 'ACTIVE',
        createdAt: '2026-09-21T10:00:00.000Z',
      },
      {
        id: 'list-002',
        orgId: 'org-ecovanguard',
        orgName: 'Ecovanguard Polymers & Flakes',
        resourceId: 'res-pet-bales',
        resource: resources[1],
        title: '28 Tonnes Clean Baled rPET Flake Feedstock',
        listingType: 'SELL',
        category: 'Plastics & Polymers',
        materialType: 'rPET (Polyethylene Terephthalate)',
        quantity: 28.0,
        unit: 'tonnes',
        pricePerUnit: 520,
        currency: 'USD',
        minimumOrderQuantity: 5.0,
        locationName: 'Sangotedo MRF, Lagos',
        lat: 6.4695,
        lng: 3.6185,
        condition: 'EXCELLENT',
        terms: 'Ready for export or local bottle-to-bottle pelletizing. Certificate of purity included.',
        status: 'ACTIVE',
        createdAt: '2026-09-23T09:15:00.000Z',
      },
      {
        id: 'list-003',
        orgId: 'org-greenbuild',
        orgName: 'GreenBuild Demolition & Remediation',
        resourceId: 'res-steel-rebar',
        resource: resources[2],
        title: '45 Tonnes Heavy Structural S275 Beams — Exchange or Sale',
        listingType: 'EXCHANGE',
        category: 'Ferrous Metals',
        materialType: 'Mild Structural Steel S275',
        quantity: 45.0,
        unit: 'tonnes',
        pricePerUnit: 550,
        currency: 'USD',
        minimumOrderQuantity: 10.0,
        locationName: 'Victoria Island Demolition Zone',
        lat: 6.4290,
        lng: 3.4210,
        condition: 'GOOD',
        exchangeWantedMaterial: 'Will exchange 1:1 value for 50 tonnes of recycled crushed aggregate concrete base (Grade 1).',
        terms: 'On-site crane available for direct flatbed truck loading.',
        status: 'ACTIVE',
        createdAt: '2026-09-24T14:00:00.000Z',
      },
    ];

    const wantedRequests: WantedRequest[] = [
      {
        id: 'req-001',
        orgId: 'org-apex',
        orgName: 'Apex Circular Metals Ltd',
        materialType: 'Aluminium 6063',
        desiredQuantity: 10.0,
        unit: 'tonnes',
        maxDistanceKm: 60,
        targetLat: 6.6018,
        targetLng: 3.3515,
        targetLocation: 'Ikeja Smelter Complex',
        maxPricePerUnit: 2200,
        currency: 'USD',
        deadline: '2026-10-15',
        status: 'OPEN',
        createdAt: '2026-09-22T10:00:00.000Z',
      },
      {
        id: 'req-002',
        orgId: 'org-ecovanguard',
        orgName: 'Ecovanguard Polymers & Flakes',
        materialType: 'HDPE Flakes',
        desiredQuantity: 15.0,
        unit: 'tonnes',
        maxDistanceKm: 45,
        targetLat: 6.4698,
        targetLng: 3.6190,
        targetLocation: 'Sangotedo Facility',
        maxPricePerUnit: 680,
        currency: 'USD',
        deadline: '2026-10-10',
        status: 'OPEN',
        createdAt: '2026-09-25T15:30:00.000Z',
      },
    ];

    const transactions: Transaction[] = [
      {
        id: 'tx-2026-0891',
        referenceNumber: 'TX-REC-2026-0891',
        listingId: 'list-001',
        listingTitle: '12.5 Tonnes Architectural 6063 Aluminium Extrusions',
        sellerOrgId: 'org-apex',
        sellerOrgName: 'Apex Circular Metals Ltd',
        buyerOrgId: 'org-ecovanguard',
        buyerOrgName: 'Ecovanguard Polymers & Flakes',
        resourceId: 'res-al-6063',
        quantity: 5.0,
        unit: 'tonnes',
        totalAmount: 10500,
        currency: 'USD',
        transactionType: 'SELL',
        status: 'DELIVERED',
        paymentStatus: 'ESCROW_HELD',
        paymentProvider: 'Paystack Escrow System',
        paymentReference: 'PAY-STK-9921-X',
        logisticsJobId: 'job-log-001',
        deliveryConfirmedAt: '2026-09-26T16:45:00.000Z',
        createdAt: '2026-09-25T08:00:00.000Z',
        updatedAt: '2026-09-26T17:00:00.000Z',
      },
    ];

    const facilities: Facility[] = [
      {
        id: 'fac-ikeja-smelter',
        orgId: 'org-apex',
        name: 'Apex Industrial Induction Smelter & Extrusion Plant',
        facilityType: 'RECYCLING_PLANT',
        acceptedMaterials: ['Aluminium 6063', 'Copper Cu-ETP', 'Brass', 'Zinc Die-Cast'],
        totalCapacityTonnesPerMonth: 1200,
        availableCapacityTonnesPerMonth: 380,
        address: 'Plot 14, Ikeja Industrial Park',
        city: 'Lagos',
        lat: 6.6018,
        lng: 3.3515,
        operatingHours: '24/7 Continuous Shift',
        certificationStatus: 'ISO 14001:2015 & NESREA Certified',
        equipment: ['5-Tonne Induction Furnace', 'Billet Casting Line', 'Optical Emission Spectrometer'],
        contactEmail: 'smelting@apexmetals.ng',
        contactPhone: '+234 1 892 4010',
      },
      {
        id: 'fac-sangotedo-mrf',
        orgId: 'org-ecovanguard',
        name: 'Ecovanguard Automated Polymer Pelletizing Center',
        facilityType: 'PROCESSING_PLANT',
        acceptedMaterials: ['rPET', 'HDPE', 'LDPE', 'Polypropylene'],
        totalCapacityTonnesPerMonth: 800,
        availableCapacityTonnesPerMonth: 210,
        address: 'KM 24 Lekki-Epe Expressway, Sangotedo',
        city: 'Lagos',
        lat: 6.4698,
        lng: 3.6190,
        operatingHours: '06:00 - 22:00 Monday - Saturday',
        certificationStatus: 'FDA Grade Food-Contact Resin Certified',
        equipment: ['Continuous Hot Wash Line', 'Near-Infrared Flake Sorter', 'Twin-Screw Extruder'],
        contactEmail: 'plant@ecovanguard.org',
        contactPhone: '+234 1 774 2210',
      },
    ];

    const capacityReservations: CapacityReservation[] = [
      {
        id: 'cap-res-001',
        facilityId: 'fac-ikeja-smelter',
        facilityName: 'Apex Industrial Induction Smelter & Extrusion Plant',
        reservingOrgId: 'org-greenbuild',
        reservingOrgName: 'GreenBuild Demolition & Remediation',
        reservedTonnes: 120,
        startDate: '2026-10-01',
        endDate: '2026-10-15',
        status: 'CONFIRMED',
        agreedRatePerTonne: 110,
        currency: 'USD',
        createdAt: '2026-09-24T11:00:00.000Z',
      },
    ];

    const vehicles: Vehicle[] = [
      {
        id: 'veh-01',
        orgId: 'org-swifttrans',
        registrationPlate: 'LAG-882-XY',
        model: 'Mercedes-Benz Actros 3340 6x4',
        type: 'HEAVY_TRUCK',
        capacityKg: 30000,
        currentLat: 6.5412,
        currentLng: 3.3644,
        locationName: 'Oshodi-Isolo Expressway',
        fuelType: 'DIESEL',
        currentStatus: 'ON_TRIP',
        assignedDriverId: 'usr-driver-1',
        assignedDriverName: 'Emeka Nwosu',
        lastInspectionDate: '2026-09-15',
      },
      {
        id: 'veh-02',
        orgId: 'org-swifttrans',
        registrationPlate: 'KJA-142-AB',
        model: 'Volvo FMX 420 32-Tonne Tipper',
        type: 'TIPPER',
        capacityKg: 32000,
        currentLat: 6.6018,
        currentLng: 3.3515,
        locationName: 'Apex Yard Staging Bay',
        fuelType: 'DIESEL',
        currentStatus: 'AVAILABLE',
        assignedDriverName: 'Unassigned',
        lastInspectionDate: '2026-09-18',
      },
      {
        id: 'veh-03',
        orgId: 'org-swifttrans',
        registrationPlate: 'VI-992-ZZ',
        model: 'DAF CF 480 Low-Bed Flatbed',
        type: 'FLATBED',
        capacityKg: 35000,
        currentLat: 6.4474,
        currentLng: 3.3644,
        locationName: 'Apapa Depot Hub',
        fuelType: 'DIESEL',
        currentStatus: 'AVAILABLE',
        assignedDriverName: 'Unassigned',
        lastInspectionDate: '2026-09-20',
      },
    ];

    const drivers: Driver[] = [
      {
        id: 'usr-driver-1',
        orgId: 'org-swifttrans',
        name: 'Emeka Nwosu',
        phone: '+234 802 334 9110',
        licenseNumber: 'FRSC-LAG-778102B',
        status: 'ON_DUTY',
        assignedVehicleId: 'veh-01',
        assignedVehiclePlate: 'LAG-882-XY',
        rating: 4.9,
        completedTrips: 342,
      },
      {
        id: 'usr-driver-2',
        orgId: 'org-swifttrans',
        name: 'Sunday Adesanya',
        phone: '+234 803 991 4040',
        licenseNumber: 'FRSC-OGN-991201A',
        status: 'AVAILABLE',
        rating: 4.8,
        completedTrips: 219,
      },
    ];

    const logisticsJobs: LogisticsJob[] = [
      {
        id: 'job-log-001',
        transactionId: 'tx-2026-0891',
        trackingNumber: 'RC-TRK-99021',
        originName: 'Apex Yard 2, Ikeja Industrial Park',
        originLat: 6.6025,
        originLng: 3.3522,
        destinationName: 'Sangotedo Polymer Recovery Facility',
        destinationLat: 6.4695,
        destinationLng: 3.6185,
        currentLat: 6.5412,
        currentLng: 3.3644,
        cargoDescription: '5.0 Tonnes Extruded 6063 Aluminium Extrusions in Steel Cradles',
        weightTonnes: 5.0,
        vehicleId: 'veh-01',
        vehiclePlate: 'LAG-882-XY',
        driverId: 'usr-driver-1',
        driverName: 'Emeka Nwosu',
        status: 'ARRIVED_DESTINATION',
        estimatedDistanceKm: 42.4,
        estimatedDurationMins: 78,
        backhaulMatched: true,
        backhaulDetails: 'Return trip matches 6.5 tonnes of HDPE regrind from Lekki to Ikeja',
        proofOfDelivery: {
          signatureName: 'Chidi Okafor (Buyer Rep)',
          photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
          deliveredAt: '2026-09-26T16:45:00.000Z',
          verifiedGpsLat: 6.4695,
          verifiedGpsLng: 3.6185,
          notes: 'Tare weight and gross weight verified on facility weighbridge. Manifest signed without discrepancy.',
        },
        createdAt: '2026-09-25T14:00:00.000Z',
        updatedAt: '2026-09-26T16:45:00.000Z',
      },
    ];

    const infrastructureReports: InfrastructureReport[] = [
      {
        id: 'inf-rep-101',
        reporterUserId: 'usr-gov-agent',
        reporterName: 'Engr. Yemi Adeleke',
        reporterOrgName: 'State Waste Management & Infrastructure Dept',
        title: 'Severe Drainage Clogging & Unregulated Plastic Accumulation',
        category: 'DRAINAGE_BLOCKAGE',
        severity: 'CRITICAL',
        status: 'VERIFIED',
        description: 'Primary stormwater canal at Mile 12 bridge severely obstructed by compressed plastic debris and silt. High flash flood risk for surrounding market stalls.',
        locationName: 'Mile 12 Primary Drainage Culvert, Ikorodu Road',
        lat: 6.6134,
        lng: 3.3931,
        imageUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80',
        assignedDepartment: 'Drainage Maintenance & Emergency Clearance Unit',
        humanVerified: true,
        verifiedBy: 'Engr. Yemi Adeleke',
        estimatedResolutionDays: 3,
        createdAt: '2026-09-24T09:30:00.000Z',
        updatedAt: '2026-09-25T14:00:00.000Z',
      },
      {
        id: 'inf-rep-102',
        reporterUserId: 'usr-field-insp',
        reporterName: 'Kemi Balogun',
        reporterOrgName: 'State Waste Management & Infrastructure Dept',
        title: 'Unsanctioned Tyre & Industrial Waste Dumpsite',
        category: 'ILLEGAL_DUMPSITE',
        severity: 'HIGH',
        status: 'ASSIGNED',
        description: 'Estimated 80 tonnes of heavy commercial truck tyres dumped in vacant marshland plot. Severe mosquito breeding and spontaneous combustion fire hazard.',
        locationName: 'Off Badagry Expressway, Ojo Buffer Zone',
        lat: 6.4682,
        lng: 3.1950,
        imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
        assignedDepartment: 'Resource Recovery & Enforcement Taskforce',
        humanVerified: true,
        verifiedBy: 'Kemi Balogun',
        estimatedResolutionDays: 5,
        createdAt: '2026-09-23T11:20:00.000Z',
        updatedAt: '2026-09-24T16:00:00.000Z',
      },
      {
        id: 'inf-rep-103',
        reporterUserId: 'usr-apex-mgr',
        reporterName: 'Fatima Ibrahim',
        reporterOrgName: 'Apex Circular Metals Ltd',
        title: 'Depression & Heavy Vehicle Pothole at Industrial Access Gate',
        category: 'ROAD_DAMAGE',
        severity: 'MEDIUM',
        status: 'REPORTED',
        description: 'Deep pavement crater outside Industrial Avenue entrance causing axle damage and severe slowing of 30-tonne haulage trucks.',
        locationName: 'Ikeja Industrial Avenue Gate 2',
        lat: 6.6012,
        lng: 3.3510,
        humanVerified: false,
        estimatedResolutionDays: 7,
        createdAt: '2026-09-26T08:15:00.000Z',
        updatedAt: '2026-09-26T08:15:00.000Z',
      },
    ];

    const satelliteDetections: SatelliteDetection[] = [
      {
        id: 'sat-det-2026-01',
        sourceSatellite: 'Sentinel-2',
        targetArea: 'Olusosun Perimeter Sector 4',
        lat: 6.5892,
        lng: 3.3821,
        detectionType: 'LANDFILL_VOLUME_EXPANSION',
        confidenceScore: 88,
        status: 'UNVERIFIED_CANDIDATE',
        imageryDate: '2026-09-24',
        changeAreaSqm: 4200,
        candidateNotes: 'Multispectral NDVI and SWIR index indicates a 4,200 m² change in surface reflective profile consistent with newly deposited organic/industrial mass. Ground inspection dispatched.',
        bounds: { north: 6.592, south: 6.586, east: 3.385, west: 3.379 },
      },
      {
        id: 'sat-det-2026-02',
        sourceSatellite: 'Copernicus-DEM',
        targetArea: 'Ikorodu Waterfront Industrial Corridor',
        lat: 6.6180,
        lng: 3.4980,
        detectionType: 'SCRAP_METAL_ACCUMULATION',
        confidenceScore: 82,
        status: 'UNVERIFIED_CANDIDATE',
        imageryDate: '2026-09-21',
        changeAreaSqm: 1850,
        candidateNotes: 'High radar backscatter anomaly indicative of dense metallic pile expansion (>2m elevation change). Candidate for circular salvage outreach.',
        bounds: { north: 6.621, south: 6.615, east: 3.501, west: 3.495 },
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'aud-001',
        timestamp: '2026-09-20T10:15:00.000Z',
        actorId: 'usr-apex-mgr',
        actorName: 'Fatima Ibrahim',
        actorRole: 'COMPANY_ADMIN',
        orgId: 'org-apex',
        action: 'RESOURCE_CREATED',
        entityType: 'Resource',
        entityId: 'res-al-6063',
        details: 'Registered 12.5 tonnes of Extruded Aluminium Scrap 6063 with digital passport.',
        ipAddress: '197.210.84.12',
      },
      {
        id: 'aud-002',
        timestamp: '2026-09-21T10:00:00.000Z',
        actorId: 'usr-apex-mgr',
        actorName: 'Fatima Ibrahim',
        actorRole: 'COMPANY_ADMIN',
        orgId: 'org-apex',
        action: 'LISTING_PUBLISHED',
        entityType: 'Listing',
        entityId: 'list-001',
        details: 'Created B2B marketplace listing at $2,100/tonne.',
        ipAddress: '197.210.84.12',
      },
      {
        id: 'aud-003',
        timestamp: '2026-09-25T08:00:00.000Z',
        actorId: 'usr-eco-buyer',
        actorName: 'Chidi Okafor',
        actorRole: 'BUYER',
        orgId: 'org-ecovanguard',
        action: 'TRANSACTION_OFFER_ACCEPTED',
        entityType: 'Transaction',
        entityId: 'tx-2026-0891',
        details: 'Accepted offer for 5.0 tonnes ($10,500) under escrow protection.',
        ipAddress: '105.112.98.44',
      },
      {
        id: 'aud-004',
        timestamp: '2026-09-26T16:45:00.000Z',
        actorId: 'usr-driver-1',
        actorName: 'Emeka Nwosu',
        actorRole: 'DRIVER',
        orgId: 'org-swifttrans',
        action: 'DELIVERY_CONFIRMED',
        entityType: 'LogisticsJob',
        entityId: 'job-log-001',
        details: 'Submitted verified proof of delivery with GPS coordinates and consignee signature.',
        ipAddress: '102.89.33.19',
      },
    ];

    return {
      users,
      organizations: orgs,
      resources,
      passports,
      warehouses,
      stockMovements,
      listings,
      wantedRequests,
      transactions,
      facilities,
      capacityReservations,
      vehicles,
      drivers,
      logisticsJobs,
      infrastructureReports,
      satelliteDetections,
      auditLogs,
      integrationSettings: {},
    };
  }
}

export const db = new DatabaseStore();

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
