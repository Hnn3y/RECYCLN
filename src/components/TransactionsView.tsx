import React, { useState } from 'react';
import type { Transaction, User, Organization } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertCircle,
  Truck,
  Building,
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  currentUser: User | null;
  currentOrg: Organization | null;
  onRefresh: () => void;
  onSelectLogisticsTab: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  currentUser,
  currentOrg,
  onRefresh,
  onSelectLogisticsTab,
}) => {
  const [selectedTxForDoc, setSelectedTxForDoc] = useState<Transaction | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleAcceptOffer = async (txId: string) => {
    setIsProcessing(txId);
    try {
      await api.acceptTransaction(txId);
      onRefresh();
    } catch (e: any) {
      alert('Acceptance failed: ' + e.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleConfirmDelivery = async (txId: string) => {
    setIsProcessing(txId);
    try {
      await api.confirmDelivery(txId, 'Weighbridge tare verified by consignee representative.');
      onRefresh();
    } catch (e: any) {
      alert('Confirmation failed: ' + e.message);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Transaction Contracts & Escrow Settlements
          </h1>
          <div className="text-xs text-neutral-400 mt-1">
            Server-enforced trade state machine: Offer → Acceptance → Escrow Reserve → Delivery → Settlement
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-neutral-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Escrow Provider: Paystack Secure Clearinghouse</span>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {transactions.map((tx) => {
          const isSeller = tx.sellerOrgId === currentOrg?.id;
          const isBuyer = tx.buyerOrgId === currentOrg?.id;

          return (
            <div
              key={tx.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 hover:border-neutral-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-emerald-400 font-mono text-xs font-semibold">
                    {tx.referenceNumber}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{tx.listingTitle}</h3>
                    <div className="text-xs text-neutral-400">
                      Created: {new Date(tx.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                      ${tx.totalAmount.toLocaleString()} {tx.currency}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      {tx.quantity} {tx.unit} · {tx.transactionType}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress State Machine Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                  <div className="text-neutral-500 text-[11px]">Contract Status</div>
                  <div className="font-semibold text-white mt-0.5">{tx.status}</div>
                </div>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                  <div className="text-neutral-500 text-[11px]">Escrow Settlement</div>
                  <div className="font-semibold text-emerald-400 mt-0.5">{tx.paymentStatus}</div>
                </div>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                  <div className="text-neutral-500 text-[11px]">Seller Organization</div>
                  <div className="font-medium text-neutral-200 mt-0.5 truncate">{tx.sellerOrgName}</div>
                </div>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                  <div className="text-neutral-500 text-[11px]">Buyer Organization</div>
                  <div className="font-medium text-neutral-200 mt-0.5 truncate">{tx.buyerOrgName}</div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  onClick={() => setSelectedTxForDoc(tx)}
                  className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Generate Consignment Note & Bill of Lading</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* Action 1: Seller Accepts Offer */}
                  {tx.status === 'OFFER' && (
                    <button
                      onClick={() => handleAcceptOffer(tx.id)}
                      disabled={isProcessing === tx.id}
                      className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {isProcessing === tx.id ? 'Processing...' : 'Accept Offer & Secure Escrow'}
                    </button>
                  )}

                  {/* Action 2: Link to Logistics dispatch if accepted */}
                  {tx.status === 'ACCEPTED' && (
                    <button
                      onClick={onSelectLogisticsTab}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Dispatch Fleet Transport</span>
                    </button>
                  )}

                  {/* Action 3: Confirm Delivery & Release Payment */}
                  {(tx.status === 'DELIVERED' || tx.status === 'ACCEPTED') && (
                    <button
                      onClick={() => handleConfirmDelivery(tx.id)}
                      disabled={isProcessing === tx.id}
                      className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {isProcessing === tx.id ? 'Settling Escrow...' : 'Confirm Delivery & Release Escrow'}
                    </button>
                  )}

                  {tx.status === 'COMPLETED' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Transaction Finalized & Escrow Cleared</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {transactions.length === 0 && (
          <div className="text-center py-16 bg-neutral-900/50 border border-dashed border-neutral-800 rounded-xl text-xs text-neutral-500">
            No transactions in the ledger yet. Submit an offer from the B2B Marketplace to initialize a trade.
          </div>
        )}
      </div>

      {/* Printable Consignment Note Document Modal */}
      {selectedTxForDoc && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <div className="text-xs font-mono text-emerald-400">RECYCLN OFFICIAL TRADE MANIFEST</div>
                <h2 className="text-xl font-bold text-white font-display mt-0.5">
                  Standard Consignment Note & Escrow Certificate
                </h2>
                <div className="text-xs text-neutral-400">Ref: {selectedTxForDoc.referenceNumber}</div>
              </div>
              <button
                onClick={() => setSelectedTxForDoc(null)}
                className="text-neutral-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white text-neutral-950 rounded-xl font-mono text-xs space-y-4 shadow-xl">
              <div className="flex justify-between border-b pb-2">
                <div>
                  <div className="font-bold text-sm">RECYCLN OPERATING SYSTEM</div>
                  <div>Automated Clearing & Settlement Note</div>
                </div>
                <div className="text-right">
                  <div>DATE: {new Date().toLocaleDateString()}</div>
                  <div>CURRENCY: {selectedTxForDoc.currency}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <div className="font-bold text-neutral-600">CONSIGNOR / SELLER:</div>
                  <div>{selectedTxForDoc.sellerOrgName}</div>
                  <div className="text-[11px] text-neutral-500">Org ID: {selectedTxForDoc.sellerOrgId}</div>
                </div>
                <div>
                  <div className="font-bold text-neutral-600">CONSIGNEE / BUYER:</div>
                  <div>{selectedTxForDoc.buyerOrgName}</div>
                  <div className="text-[11px] text-neutral-500">Org ID: {selectedTxForDoc.buyerOrgId}</div>
                </div>
              </div>

              <div className="space-y-1 border-b pb-3">
                <div className="font-bold text-neutral-600">MANIFEST ITEMS:</div>
                <div className="flex justify-between">
                  <span>{selectedTxForDoc.listingTitle}</span>
                  <span>{selectedTxForDoc.quantity} {selectedTxForDoc.unit}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2">
                  <span>ESCROW SETTLEMENT AMOUNT:</span>
                  <span>${selectedTxForDoc.totalAmount.toLocaleString()} USD</span>
                </div>
              </div>

              <div className="text-[10px] text-neutral-500 space-y-1">
                <div>VERIFICATION PROOF: This document is linked to W3C Resource Passport cryptographic ledger.</div>
                <div>PAYMENT STATUS: {selectedTxForDoc.paymentStatus} via Paystack Escrow Clearinghouse.</div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold text-xs rounded-lg cursor-pointer"
              >
                Print / Save PDF
              </button>
              <button
                onClick={() => setSelectedTxForDoc(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
