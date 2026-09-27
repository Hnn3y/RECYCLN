import React from 'react';
import type { User, Organization } from '../types/index.ts';
import { Sparkles, Building2, ShieldCheck, ChevronDown } from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User | null;
  currentOrg: Organization | null;
  users: User[];
  orgs: Organization[];
  onSwitchUser: (user: User) => void;
  onSwitchOrg: (org: Organization) => void;
  onOpenCopilot: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  currentOrg,
  users,
  orgs,
  onSwitchUser,
  onSwitchOrg,
  onOpenCopilot,
}) => {
  const [showOrgDropdown, setShowOrgDropdown] = React.useState(false);
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  const navLinks = [
    { id: 'map', label: 'Network Map' },
    { id: 'resources', label: 'Resources' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'logistics', label: 'Logistics & Fleet' },
    { id: 'facilities', label: 'Facilities' },
    { id: 'infrastructure', label: 'Civic Infra' },
    { id: 'satellite', label: 'Satellite Intel' },
    { id: 'integrations', label: 'Integrations & Audit' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('map')}
            className="text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors cursor-pointer"
          >
            RECYCLN
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-neutral-400">
          {navLinks.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
                currentTab === item.id
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                  : 'hover:text-neutral-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Tenant Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowOrgDropdown(!showOrgDropdown);
                setShowUserDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-md hover:border-neutral-700 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium max-w-[120px] truncate">
                {currentOrg?.name || 'Apex Circular Metals'}
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-500" />
            </button>

            {showOrgDropdown && (
              <div className="absolute right-0 mt-1 w-64 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl p-1 z-50">
                <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">
                  Active Organization (Multi-Tenant)
                </div>
                {orgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      onSwitchOrg(org);
                      setShowOrgDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors flex items-center justify-between ${
                      currentOrg?.id === org.id
                        ? 'bg-neutral-800 text-emerald-400 font-medium'
                        : 'text-neutral-300 hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="truncate">
                      <div className="truncate">{org.name}</div>
                      <div className="text-[10px] text-neutral-500">{org.city} · {org.category}</div>
                    </div>
                    {org.verificationStatus === 'VERIFIED' && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowOrgDropdown(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-md hover:border-neutral-700 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium max-w-[90px] truncate">{currentUser?.name?.split(' ')[0]}</span>
              <span className="text-[10px] text-neutral-500 uppercase">{currentUser?.role.replace('_', ' ')}</span>
              <ChevronDown className="w-3 h-3 text-neutral-500" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-1 w-56 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl p-1 z-50">
                <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">
                  Switch Active Role (RBAC)
                </div>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors flex items-center justify-between ${
                      currentUser?.id === u.id
                        ? 'bg-neutral-800 text-emerald-400 font-medium'
                        : 'text-neutral-300 hover:bg-neutral-800/60'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-[10px] text-neutral-500">{u.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Copilot Action Button */}
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Copilot</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation tab scrollbar */}
      <div className="lg:hidden flex items-center gap-4 px-4 py-2 overflow-x-auto border-t border-neutral-900 text-xs text-neutral-400">
        {navLinks.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`whitespace-nowrap pb-1 ${
              currentTab === item.id ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400' : ''
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
