import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, MessageSquare } from 'lucide-react';
import { sendCopilotQuery, fetchCopilotBriefing } from '../api/client';

export const CopilotDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; category?: string; highlight?: string }>>([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBriefing();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadBriefing = async () => {
    try {
      const data = await fetchCopilotBriefing();
      const summaryText = `
**${data.headline}**

*Executive Operational Takeaways:*
${data.executive_takeaways.join('\n')}

*Required Logistics Actions:*
${data.critical_actions_required.join('\n')}
      `;
      setMessages([{ sender: 'bot', text: summaryText, category: 'Operational Briefing' }]);
    } catch (err) {
      console.error('Error loading briefing:', err);
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputVal.trim();
    if (!textToSend) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    if (!queryText) setInputVal('');
    setLoading(true);

    try {
      const res = await sendCopilotQuery(textToSend);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: res.answer,
          category: res.category,
          highlight: res.metric_highlight
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'Error connecting to Supply Chain Copilot engine.', category: 'Error' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-cyan-500/40 hover:scale-105 hover:rotate-3 transition-all z-40 cursor-pointer"
        title="Open AI Supply Chain Copilot"
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Slide-over Drawer */}
      {isOpen && (
        <aside className="fixed bottom-24 right-6 w-[420px] max-w-[calc(100vw-3rem)] h-[580px] glass-panel rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-6">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/90">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Supply Chain AI Copilot</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-xl max-w-[92%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-medium shadow-md shadow-cyan-500/20'
                      : 'bg-white/5 border border-white/10 text-slate-200'
                  }`}
                >
                  {m.category && (
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-cyan-400 mb-1 border-b border-white/10 pb-1">
                      <span>{m.category}</span>
                      {m.highlight && (
                        <span className="text-emerald-400 font-mono font-bold lowercase">
                          {m.highlight}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="whitespace-pre-line text-xs font-sans">
                    {m.text}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>Evaluating multi-tier graph and FEFO constraints...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Suggested Quick Inquiry Pills */}
          <div className="px-4 py-2 bg-slate-900/80 border-t border-white/10 flex flex-wrap gap-1.5">
            <button
              onClick={() => handleSend('Why was FEFO prioritized for dairy batches?')}
              className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all cursor-pointer"
            >
              💡 Why FEFO Prioritized?
            </button>
            <button
              onClick={() => handleSend('Show me the ROI and savings vs legacy baseline')}
              className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all cursor-pointer"
            >
              📊 ROI vs Baseline
            </button>
            <button
              onClick={() => handleSend('Which stores face critical stockout risk?')}
              className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all cursor-pointer"
            >
              🚨 Stockout Risks
            </button>
            <button
              onClick={() => handleSend('How are cold-chain products managed?')}
              className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all cursor-pointer"
            >
              ❄️ Cold-Chain Routes
            </button>
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-slate-900 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about routing, trade-offs, bottlenecks..."
              className="flex-1 text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={() => handleSend()}
              className="px-3 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-400 transition-all cursor-pointer shadow-md shadow-cyan-500/25"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}
    </>
  );
};
