import React, { useState, useRef, useEffect } from 'react';
import type { CopilotMessage, User, Organization } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  Sparkles,
  Send,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Terminal,
  AlertCircle,
  CheckCircle,
  Truck,
  RotateCcw,
} from 'lucide-react';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  currentOrg: Organization | null;
  onRefreshData: () => void;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentOrg,
  onRefreshData,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      content:
        'Welcome to RECYCLN AI Operations Copilot. Connected to live network nodes: 12.5t aluminium scrap available at Ikeja, 3 haulage trucks stationed, and 380t/mo induction capacity ready. How can I assist operations?',
      timestamp: new Date().toLocaleTimeString(),
      mode: 'OPERATIONS',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [activeMode, setActiveMode] = useState<'SUPPORT' | 'OPERATIONS' | 'TRANSACTION'>('OPERATIONS');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedToolIndex, setExpandedToolIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString(),
      mode: activeMode,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const result = await api.sendCopilotMessage(
        query,
        activeMode,
        currentUser?.role || 'COMPANY_ADMIN',
        currentOrg?.id || 'org-apex'
      );

      const assistantMsg: CopilotMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        content: result.reply,
        timestamp: new Date().toLocaleTimeString(),
        mode: result.mode,
        toolCalls: result.toolCalls,
        consequentialAction: result.consequentialAction,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          content: 'Operational intelligence query error: ' + err.message,
          timestamp: new Date().toLocaleTimeString(),
          mode: activeMode,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteConsequentialAction = async (msgId: string, action: any) => {
    try {
      if (action.actionType === 'DISPATCH_LOGISTICS_JOB') {
        await api.dispatchJob({
          vehicleId: action.payload.vehicleId,
          cargoDescription: action.payload.cargoDescription,
          weightTonnes: action.payload.weightTonnes,
          originName: action.payload.originLocation,
          destinationName: action.payload.destinationLocation,
          actorName: currentUser?.name || 'Copilot Authorized Exec',
        });

        // Mark executed
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === msgId && m.consequentialAction) {
              return {
                ...m,
                consequentialAction: { ...m.consequentialAction, executed: true },
              };
            }
            return m;
          })
        );

        onRefreshData();
      }
    } catch (e: any) {
      alert('Execution failed: ' + e.message);
    }
  };

  const samplePrompts = [
    'Show me available aluminium scrap within 50 km',
    'What is the current fleet availability status?',
    'Check open smelter and MRF processing capacity',
    'Prepare haulage dispatch order for available scrap',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Copilot Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
              <span>Operations Copilot</span>
              <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.2 bg-emerald-950/60 rounded border border-emerald-800">
                LIVE
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Role: {currentUser?.role} · Org: {currentOrg?.name}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Switcher Bar (Support, Operations, Transaction) */}
      <div className="p-2 border-b border-neutral-800/80 bg-neutral-900/40 grid grid-cols-3 gap-1 text-[11px]">
        <button
          onClick={() => setActiveMode('SUPPORT')}
          className={`py-1.5 rounded-md font-medium transition-colors ${
            activeMode === 'SUPPORT' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Support Mode
        </button>
        <button
          onClick={() => setActiveMode('OPERATIONS')}
          className={`py-1.5 rounded-md font-medium transition-colors ${
            activeMode === 'OPERATIONS' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Operations Mode
        </button>
        <button
          onClick={() => setActiveMode('TRANSACTION')}
          className={`py-1.5 rounded-md font-medium transition-colors ${
            activeMode === 'TRANSACTION' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Transaction Mode
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`flex flex-col space-y-2 ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[90%] p-3.5 rounded-xl leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-emerald-500 text-neutral-950 font-medium'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-200'
              }`}
            >
              {msg.content}
            </div>

            {/* Tool Invocations Dropdown */}
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div className="w-full max-w-[90%] bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-[11px] font-mono">
                <button
                  onClick={() => setExpandedToolIndex(expandedToolIndex === i ? null : i)}
                  className="w-full flex items-center justify-between text-neutral-400 hover:text-neutral-200"
                >
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Backend Tools Executed ({msg.toolCalls.length})</span>
                  </span>
                  {expandedToolIndex === i ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>

                {expandedToolIndex === i && (
                  <div className="mt-2 pt-2 border-t border-neutral-800 space-y-2">
                    {msg.toolCalls.map((tc, tcIdx) => (
                      <div key={tcIdx} className="space-y-0.5">
                        <div className="text-cyan-400 font-semibold">{tc.toolName}()</div>
                        <pre className="text-[10px] text-neutral-400 bg-neutral-900 p-1.5 rounded overflow-x-auto">
                          {JSON.stringify(tc.output, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Interactive Consequential Action Confirmation Card */}
            {msg.consequentialAction && (
              <div className="w-full max-w-[90%] bg-neutral-900 border border-emerald-800/80 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Interactive Confirmation Required</span>
                </div>
                <div className="text-neutral-300 leading-normal">
                  {msg.consequentialAction.summary}
                </div>

                <div className="pt-2 flex items-center justify-end">
                  {msg.consequentialAction.executed ? (
                    <div className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Action Committed to Fleet Dispatch</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleExecuteConsequentialAction(msg.id, msg.consequentialAction)}
                      className="px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold rounded-md text-xs transition-colors cursor-pointer"
                    >
                      Authorize & Execute Action
                    </button>
                  )}
                </div>
              </div>
            )}

            <span className="text-[10px] text-neutral-500 font-mono">{msg.timestamp}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="p-2 border-t border-neutral-800/80 bg-neutral-900/30 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-md border border-neutral-800 whitespace-nowrap transition-colors cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-neutral-800 bg-neutral-900/60 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask ${activeMode.toLowerCase()} query or instruction...`}
          className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="p-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-neutral-950 rounded-lg transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
