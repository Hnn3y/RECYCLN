import type {
  Resource,
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
  AuditLog,
  EnvironmentalMetric,
  Warehouse,
  StockMovement,
  User,
  Organization,
} from '../types/index.ts';

const API_BASE = '/api';

export const api = {
  // Auth & Context
  async getAuthContext(): Promise<{ users: User[]; organizations: Organization[] }> {
    const res = await fetch(`${API_BASE}/auth/context`);
    if (!res.ok) throw new Error('Failed to fetch auth context');
    return res.json();
  },

  // Resources
  async getResources(params?: { status?: string; category?: string; search?: string }): Promise<Resource[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/resources${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch resources');
    return res.json();
  },

  async createResource(data: any): Promise<Resource> {
    const res = await fetch(`${API_BASE}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create resource');
    }
    return res.json();
  },

  async getResourcePassport(resourceId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/resources/${resourceId}/passport`);
    if (!res.ok) throw new Error('Failed to fetch resource passport');
    return res.json();
  },

  // Scanner
  async scanResource(imageBase64?: string, textHint?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/scanner/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, textHint }),
    });
    if (!res.ok) throw new Error('Resource scan failed');
    return res.json();
  },

  // Inventory
  async getWarehouses(): Promise<Warehouse[]> {
    const res = await fetch(`${API_BASE}/inventory/warehouses`);
    if (!res.ok) throw new Error('Failed to fetch warehouses');
    return res.json();
  },

  async getStockMovements(): Promise<StockMovement[]> {
    const res = await fetch(`${API_BASE}/inventory/movements`);
    if (!res.ok) throw new Error('Failed to fetch stock movements');
    return res.json();
  },

  async transferInventory(data: any): Promise<StockMovement> {
    const res = await fetch(`${API_BASE}/inventory/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Inventory transfer failed');
    }
    return res.json();
  },

  // Marketplace
  async getListings(type?: string): Promise<Listing[]> {
    const res = await fetch(`${API_BASE}/marketplace/listings${type ? `?listingType=${type}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch listings');
    return res.json();
  },

  async createListing(data: any): Promise<Listing> {
    const res = await fetch(`${API_BASE}/marketplace/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create listing');
    }
    return res.json();
  },

  async getWantedRequests(): Promise<WantedRequest[]> {
    const res = await fetch(`${API_BASE}/marketplace/wanted`);
    if (!res.ok) throw new Error('Failed to fetch wanted requests');
    return res.json();
  },

  async createWantedRequest(data: any): Promise<WantedRequest> {
    const res = await fetch(`${API_BASE}/marketplace/wanted`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create wanted request');
    return res.json();
  },

  async getMatches(wantedId?: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/marketplace/match${wantedId ? `?wantedId=${wantedId}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch matches');
    return res.json();
  },

  async getValuation(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/marketplace/valuation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to compute valuation');
    return res.json();
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    const res = await fetch(`${API_BASE}/transactions`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async createOffer(data: any): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit offer');
    return res.json();
  },

  async acceptTransaction(id: string): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions/${id}/accept`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to accept transaction');
    return res.json();
  },

  async confirmDelivery(id: string, notes?: string): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions/${id}/confirm-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) throw new Error('Failed to confirm delivery');
    return res.json();
  },

  // Facilities
  async getFacilities(): Promise<Facility[]> {
    const res = await fetch(`${API_BASE}/facilities`);
    if (!res.ok) throw new Error('Failed to fetch facilities');
    return res.json();
  },

  async getCapacityReservations(): Promise<CapacityReservation[]> {
    const res = await fetch(`${API_BASE}/facilities/reservations`);
    if (!res.ok) throw new Error('Failed to fetch capacity reservations');
    return res.json();
  },

  async reserveCapacity(data: any): Promise<CapacityReservation> {
    const res = await fetch(`${API_BASE}/facilities/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Capacity reservation failed');
    }
    return res.json();
  },

  // Logistics
  async getVehicles(): Promise<Vehicle[]> {
    const res = await fetch(`${API_BASE}/logistics/vehicles`);
    if (!res.ok) throw new Error('Failed to fetch vehicles');
    return res.json();
  },

  async getDrivers(): Promise<Driver[]> {
    const res = await fetch(`${API_BASE}/logistics/drivers`);
    if (!res.ok) throw new Error('Failed to fetch drivers');
    return res.json();
  },

  async getLogisticsJobs(): Promise<LogisticsJob[]> {
    const res = await fetch(`${API_BASE}/logistics/jobs`);
    if (!res.ok) throw new Error('Failed to fetch logistics jobs');
    return res.json();
  },

  async dispatchJob(data: any): Promise<LogisticsJob> {
    const res = await fetch(`${API_BASE}/logistics/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Dispatch failed');
    }
    return res.json();
  },

  async submitProofOfDelivery(jobId: string, data: any): Promise<LogisticsJob> {
    const res = await fetch(`${API_BASE}/logistics/jobs/${jobId}/pod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Proof of delivery failed');
    return res.json();
  },

  // Infrastructure
  async getInfrastructureReports(): Promise<InfrastructureReport[]> {
    const res = await fetch(`${API_BASE}/infrastructure`);
    if (!res.ok) throw new Error('Failed to fetch infrastructure reports');
    return res.json();
  },

  async createInfrastructureReport(data: any): Promise<InfrastructureReport> {
    const res = await fetch(`${API_BASE}/infrastructure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to log report');
    return res.json();
  },

  async triageReport(id: string, data: any): Promise<InfrastructureReport> {
    const res = await fetch(`${API_BASE}/infrastructure/${id}/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Triage failed');
    return res.json();
  },

  // Satellite
  async getSatelliteDetections(): Promise<SatelliteDetection[]> {
    const res = await fetch(`${API_BASE}/satellite`);
    if (!res.ok) throw new Error('Failed to fetch satellite detections');
    return res.json();
  },

  // Copilot
  async sendCopilotMessage(query: string, mode: string, userRole: string, userOrgId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, mode, userRole, userOrgId }),
    });
    if (!res.ok) throw new Error('Copilot query failed');
    return res.json();
  },

  // Integrations & Audit
  async getIntegrations(): Promise<IntegrationStatus[]> {
    const res = await fetch(`${API_BASE}/integrations`);
    if (!res.ok) throw new Error('Failed to fetch integrations');
    return res.json();
  },

  async testIntegration(keyName: string): Promise<any> {
    const res = await fetch(`${API_BASE}/integrations/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyName }),
    });
    if (!res.ok) throw new Error('Integration test failed');
    return res.json();
  },

  async saveIntegrationKey(keyName: string, keyValue: string): Promise<any> {
    const res = await fetch(`${API_BASE}/integrations/key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyName, keyValue }),
    });
    if (!res.ok) throw new Error('Key save failed');
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/audit`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getEnvironmentalMetrics(): Promise<EnvironmentalMetric> {
    const res = await fetch(`${API_BASE}/analytics/environmental`);
    if (!res.ok) throw new Error('Failed to fetch environmental metrics');
    return res.json();
  },
};
