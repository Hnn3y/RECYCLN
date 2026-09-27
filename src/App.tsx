import React, { useState, useEffect } from 'react';
import { api } from './services/api.ts';
import type {
  User,
  Organization,
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
} from './types/index.ts';

import { Navigation } from './components/Navigation.tsx';
import { EnvironmentalImpactBar } from './components/EnvironmentalImpactBar.tsx';
import { GeospatialMap } from './components/GeospatialMap';
import { ResourcesView } from './components/ResourcesView.tsx';
import { ResourceScannerModal } from './components/ResourceScannerModal.tsx';
import { MarketplaceView } from './components/MarketplaceView.tsx';
import { TransactionsView } from './components/TransactionsView.tsx';
import { LogisticsView } from './components/LogisticsView.tsx';
import { FacilitiesView } from './components/FacilitiesView.tsx';
import { InfrastructureView } from './components/InfrastructureView.tsx';
import { SatelliteView } from './components/SatelliteView.tsx';
import { AdminIntegrationsView } from './components/AdminIntegrationsView.tsx';
import { CopilotDrawer } from './components/CopilotDrawer.tsx';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('map');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);

  // Platform Entities State
  const [resources, setResources] = useState<Resource[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [wantedRequests, setWantedRequests] = useState<WantedRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [capacityReservations, setCapacityReservations] = useState<CapacityReservation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [logisticsJobs, setLogisticsJobs] = useState<LogisticsJob[]>([]);
  const [infrastructureReports, setInfrastructureReports] = useState<InfrastructureReport[]>([]);
  const [satelliteDetections, setSatelliteDetections] = useState<SatelliteDetection[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [environmentalMetrics, setEnvironmentalMetrics] = useState<EnvironmentalMetric | null>(null);

  // Modals & Drawers
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Fetch all live backend data
  const loadPlatformData = async () => {
    try {
      const [
        authContext,
        resList,
        listList,
        wantedList,
        txList,
        facList,
        capList,
        vehList,
        drvList,
        jobList,
        repList,
        satList,
        intList,
        audList,
        envMetrics,
      ] = await Promise.all([
        api.getAuthContext(),
        api.getResources(),
        api.getListings(),
        api.getWantedRequests(),
        api.getTransactions(),
        api.getFacilities(),
        api.getCapacityReservations(),
        api.getVehicles(),
        api.getDrivers(),
        api.getLogisticsJobs(),
        api.getInfrastructureReports(),
        api.getSatelliteDetections(),
        api.getIntegrations(),
        api.getAuditLogs(),
        api.getEnvironmentalMetrics(),
      ]);

      setUsers(authContext.users);
      setOrgs(authContext.organizations);

      if (!currentUser && authContext.users.length > 0) {
        setCurrentUser(authContext.users[0]);
      }
      if (!currentOrg && authContext.organizations.length > 0) {
        setCurrentOrg(authContext.organizations[0]);
      }

      setResources(resList);
      setListings(listList);
      setWantedRequests(wantedList);
      setTransactions(txList);
      setFacilities(facList);
      setCapacityReservations(capList);
      setVehicles(vehList);
      setDrivers(drvList);
      setLogisticsJobs(jobList);
      setInfrastructureReports(repList);
      setSatelliteDetections(satList);
      setIntegrations(intList);
      setAuditLogs(audList);
      setEnvironmentalMetrics(envMetrics);
    } catch (err) {
      console.error('Failed to load initial platform data:', err);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      {/* Top Bar Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        currentOrg={currentOrg}
        users={users}
        orgs={orgs}
        onSwitchUser={setCurrentUser}
        onSwitchOrg={setCurrentOrg}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Environmental Impact Ledger Bar */}
        <EnvironmentalImpactBar metrics={environmentalMetrics} />

        {/* Tab 1: Geospatial Network Map */}
        {currentTab === 'map' && (
          <GeospatialMap
            resources={resources}
            facilities={facilities}
            vehicles={vehicles}
            reports={infrastructureReports}
            satelliteDetections={satelliteDetections}
            onSelectResource={(res) => {
              setCurrentTab('resources');
            }}
            onSelectFacility={(fac) => {
              setCurrentTab('facilities');
            }}
          />
        )}

        {/* Tab 2: Resources & Passports */}
        {currentTab === 'resources' && (
          <ResourcesView
            resources={resources}
            currentUser={currentUser}
            currentOrg={currentOrg}
            onRefresh={loadPlatformData}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenCreateListing={() => {
              setCurrentTab('marketplace');
            }}
          />
        )}

        {/* Tab 3: Marketplace & AI Matching */}
        {currentTab === 'marketplace' && (
          <MarketplaceView
            listings={listings}
            wantedRequests={wantedRequests}
            resources={resources}
            currentUser={currentUser}
            currentOrg={currentOrg}
            onRefresh={loadPlatformData}
            onOpenTransactionTab={() => setCurrentTab('transactions')}
          />
        )}

        {/* Tab 4: Transactions & Escrow */}
        {currentTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            currentUser={currentUser}
            currentOrg={currentOrg}
            onRefresh={loadPlatformData}
            onSelectLogisticsTab={() => setCurrentTab('logistics')}
          />
        )}

        {/* Tab 5: Logistics & Fleet Command */}
        {currentTab === 'logistics' && (
          <LogisticsView
            vehicles={vehicles}
            drivers={drivers}
            jobs={logisticsJobs}
            currentUser={currentUser}
            currentOrg={currentOrg}
            onRefresh={loadPlatformData}
          />
        )}

        {/* Tab 6: Facilities & Capacity Marketplace */}
        {currentTab === 'facilities' && (
          <FacilitiesView
            facilities={facilities}
            reservations={capacityReservations}
            currentUser={currentUser}
            currentOrg={currentOrg}
            onRefresh={loadPlatformData}
          />
        )}

        {/* Tab 7: Civic Infrastructure Intelligence */}
        {currentTab === 'infrastructure' && (
          <InfrastructureView
            reports={infrastructureReports}
            currentUser={currentUser}
            currentOrg={currentOrg}
            onRefresh={loadPlatformData}
          />
        )}

        {/* Tab 8: Satellite Intelligence */}
        {currentTab === 'satellite' && (
          <SatelliteView
            detections={satelliteDetections}
            currentUser={currentUser}
            currentOrg={currentOrg}
            onRefresh={loadPlatformData}
          />
        )}

        {/* Tab 9: Integrations & Audit Governance */}
        {currentTab === 'integrations' && (
          <AdminIntegrationsView
            integrations={integrations}
            auditLogs={auditLogs}
            currentUser={currentUser}
            currentOrg={currentOrg}
            onRefresh={loadPlatformData}
          />
        )}
      </main>

      {/* AI Resource Scanner Modal */}
      <ResourceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        currentUser={currentUser}
        currentOrg={currentOrg}
        onResourceCreated={loadPlatformData}
      />

      {/* AI Operations Copilot Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentUser={currentUser}
        currentOrg={currentOrg}
        onRefreshData={loadPlatformData}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-neutral-900 py-6 mt-12 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>RECYCLN Operating System · Autonomous Circular Resource & Infrastructure Network</div>
          <div className="font-mono text-[11px] text-neutral-400">
            Tenant: {currentOrg?.name} ({currentOrg?.verificationStatus}) · Role: {currentUser?.role}
          </div>
        </div>
      </footer>
    </div>
  );
}
