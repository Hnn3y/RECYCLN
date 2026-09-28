import React, { useState } from 'react';
import type { IntegrationStatus, AuditLog, User, Organization } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCw,
  ExternalLink,
  Lock,
  History,
} from 'lucide-react';

interface AdminIntegrationsViewProps {
  integrations: IntegrationStatus[];
  auditLogs: AuditLog[];
  currentUser: User | null;
  currentOrg: Organization | null;
  onRefresh: () => void;
}

export const AdminIntegrationsView: React.FC<AdminIntegrationsViewProps> = ({
  integrations,
  auditLogs,
  currentUser,
  currentOrg,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'integrations' | 'audit'>('integrations');
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: string; message: string }>>({});

  // Key Entry State
  const [keyToEdit, setKeyToEdit] = useState<IntegrationStatus | null>(null);
  const [enteredKeyValue, setEnteredKeyValue] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);

  const handleTestConnection = async (keyName: string) => {
    setTestingKey(keyName);
    try {
      const result = await api.testIntegration(keyName);
      setTestResults((prev) => ({
        ...prev,
        [keyName]: result,
      }));
    } catch (e: any) {
      setTestResults((prev) => ({
        ...prev,
        [keyName]: { status: 'ERROR', message: e.message || 'Connection test failed' },
      }));
    } finally {
      setTestingKey(null);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyToEdit || !enteredKeyValue.trim()) return;

    setIsSavingKey(true);
    try {
      await api.saveIntegrationKey(keyToEdit.keyName, enteredKeyValue);
      setKeyToEdit(null);
      setEnteredKeyValue('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save key');
    } finally {
      setIsSavingKey(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Provider Integrations & Platform Governance
          </h1>
          <div className="text-xs text-neutral-400 mt-1">
            Section 8.1 pluggable external credentials, real connectivity health tests, and immutable audit events
          </div>
        </div>

        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'integrations' ? 'bg-neutral-800 text-emerald-400 shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Integrations Health ({integrations.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'audit' ? 'bg-neutral-800 text-emerald-400 shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Immutable Audit Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* 1. INTEGRATIONS HEALTH CHECK TABLE */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
            <h2 className="text-sm font-semibold text-white">External Provider Readiness Status</h2>
            <div className="text-xs text-neutral-400 leading-relaxed">
              Tests verify provider connectivity or credentials only. A configured key does not mean an app workflow is implemented; rows describe the specific capability each check covers.
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="text-[11px] uppercase text-neutral-500 bg-neutral-950 border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Provider / Capability</th>
                    <th className="py-3 px-4">Environment Key</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Live Test Result</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-mono">
                  {integrations.map((item) => {
                    const test = testResults[item.keyName];
                    const isConfigured = item.status === 'CONFIGURED';

                    return (
                      <tr key={item.keyName} className="hover:bg-neutral-800/30">
                        <td className="py-3 px-4 font-sans">
                          <div className="font-semibold text-white">{item.name}</div>
                          <div className="text-[11px] text-neutral-500 font-sans">{item.category}</div>
                        </td>
                        <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                          {item.keyName}
                        </td>
                        <td className="py-3 px-4 text-center font-sans">
                          {isConfigured ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Configured</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-medium bg-neutral-950 text-neutral-400 border border-neutral-800">
                              <XCircle className="w-3 h-3" />
                              <span>Not Configured</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-sans text-xs">
                          {test ? (
                            <div
                              className={`text-[11px] ${
                                test.status === 'CONFIGURED' ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {test.message}
                            </div>
                          ) : (
                            <span className="text-[11px] text-neutral-500 font-sans italic">
                              Ready for live connectivity check
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleTestConnection(item.keyName)}
                              disabled={testingKey === item.keyName}
                              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {testingKey === item.keyName ? (
                                <RotateCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3 text-emerald-400" />
                              )}
                              <span>Test Connection</span>
                            </button>

                            <button
                              onClick={() => setKeyToEdit(item)}
                              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Key className="w-3 h-3 text-neutral-400" />
                              <span>Set Key</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. IMMUTABLE AUDIT LOGS TABLE */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
            <h2 className="text-sm font-semibold text-white">Immutable System Audit Log</h2>
            <div className="text-xs text-neutral-400 mt-0.5">
              Records actor identity, organization, role, action, and entity hash for all platform transitions
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="text-[11px] uppercase text-neutral-500 bg-neutral-950 border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4 text-right">IP Origin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-800/30">
                      <td className="py-2.5 px-4 text-neutral-400 tabular-nums whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-sans text-white">
                        <div>{log.actorName}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">{log.actorRole}</div>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-emerald-400">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-4 text-neutral-300">
                        {log.entityType} ({log.entityId})
                      </td>
                      <td className="py-2.5 px-4 font-sans text-neutral-300 max-w-xs truncate">
                        {log.details}
                      </td>
                      <td className="py-2.5 px-4 text-right text-neutral-500 tabular-nums">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Set Key Runtime Modal */}
      {keyToEdit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveKey}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Configure Provider Key</h3>
                <div className="text-xs text-neutral-400">{keyToEdit.name}</div>
              </div>
              <button
                type="button"
                onClick={() => setKeyToEdit(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-1 text-neutral-400">
              <div>Key Variable: <span className="font-mono text-emerald-400">{keyToEdit.keyName}</span></div>
              <div className="text-[11px]">{keyToEdit.description}</div>
              <a
                href={keyToEdit.documentationUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1 text-[11px] mt-1"
              >
                <span>Obtain API key from provider console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block text-neutral-400">Enter Secret or Token</label>
              <input
                type="password"
                required
                placeholder="sk_live_..."
                value={enteredKeyValue}
                onChange={(e) => setEnteredKeyValue(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setKeyToEdit(null)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingKey}
                className="px-4 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-neutral-950 rounded-lg cursor-pointer"
              >
                {isSavingKey ? 'Saving...' : 'Apply Key Runtime'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
