import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, Send, Terminal, FileText, Copy, Check } from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';
import { Button } from '../components/ui/Button';
import { AITypingText } from '../components/ai/AITypingText';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  codeSnippet?: string;
  timestamp: string;
}

export const AIAssistantPage: React.FC = () => {
  const { incidents } = useIncidentStore();
  const [selectedIncidentId, setSelectedIncidentId] = useState(incidents[0]?.id || '');
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeIncident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-0',
      sender: 'ai',
      text: `Hello! I am your AI Security Copilot connected to ${activeIncident?.title || 'the active incident'}. I can generate Root Cause Analyses (RCA), synthesize diagnostic logs, write remediation code patches, or draft executive summaries. What would you like me to analyze?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleSendMessage = (userPromptText?: string) => {
    const textToSend = userPromptText || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userPromptText) setInput('');
    setIsGenerating(true);

    setTimeout(() => {
      let aiResponseText = `Based on deep analysis of ${activeIncident.title} (${activeIncident.id}), the AI Security Engine identified a memory leak in the connection pool logic under SYN flood conditions.`;
      let codeSnippet: string | undefined = undefined;

      if (textToSend.includes('RCA') || textToSend.includes('Root Cause')) {
        aiResponseText = `### Root Cause Analysis (RCA) Report\n**Incident:** ${activeIncident.title}\n**Severity:** ${activeIncident.severity}\n\n**Primary Finding:** Unbounded memory growth in container pool under high ingress churn. The connection lifetime exceeded the 2500ms API timeout threshold.`;
        codeSnippet = `// Applied Remediation Patch\nctx, cancel := context.WithTimeout(r.Context(), 2500*time.Millisecond)\ndefer cancel()\n\nconnPool.SetMaxOpenConns(100)`;
      } else if (textToSend.includes('Report') || textToSend.includes('Executive')) {
        aiResponseText = `### Executive Summary Report\n**Scope:** ${activeIncident.title}\n**Impact:** 15-minute degradation resolved with zero data loss.\n**Status:** ${activeIncident.status}\n\n**Recommendation:** Roll out auth-service v2.4.2 patch to all production regions.`;
      }

      const aiMsg: Message = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: aiResponseText,
        codeSnippet,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsGenerating(false);
    }, 1000);
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Code copied to clipboard', {
      style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" /> AI Security Copilot Console
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
              GPT-4o SECURITY AGENT
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Automated RCA generation, log synthesis, and automated patch creation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400">Context:</span>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-surface border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500 max-w-xs truncate"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                [{inc.severity}] {inc.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 bg-surface border border-subtle rounded-xl flex flex-col min-h-0 overflow-hidden shadow-2xl">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-zinc-800 border border-zinc-700 text-zinc-200'
                    : 'bg-indigo-950 border border-indigo-700 text-indigo-400'
                }`}
              >
                {msg.sender === 'user' ? (
                  <FileText className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>

              <div
                className={`p-4 rounded-xl text-xs leading-relaxed space-y-3 ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'bg-surface-elevated border border-zinc-800/80 text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] font-mono opacity-75 pb-1 border-b border-white/10">
                  <span className="font-semibold">
                    {msg.sender === 'user' ? 'Security Operator' : 'AI Copilot Subagent'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="whitespace-pre-wrap">
                  {msg.sender === 'ai' ? <AITypingText text={msg.text} speed={10} /> : msg.text}
                </div>

                {msg.codeSnippet && (
                  <div className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-cyan-300 relative">
                    <div className="flex items-center justify-between mb-1 text-[10px] text-zinc-500 border-b border-zinc-900 pb-1">
                      <span className="flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-cyan-400" /> Proposed Remediation Patch
                      </span>
                      <button
                        onClick={() => handleCopyCode(msg.id, msg.codeSnippet!)}
                        className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        {copiedId === msg.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre>{msg.codeSnippet}</pre>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isGenerating && (
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 animate-pulse">
              <Sparkles className="w-4 h-4" /> AI Copilot is analyzing telemetry...
            </div>
          )}
        </div>

        <div className="px-6 py-2 border-t border-subtle bg-zinc-950/40 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] font-mono text-zinc-500 uppercase shrink-0">Shortcuts:</span>
          {[
            'Generate RCA Report',
            'Analyze Diagnostic Logs',
            'Draft Executive Report',
            'Propose Code Patch',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-indigo-500/60 transition-colors shrink-0 text-xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 border-t border-subtle bg-surface flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask AI Copilot about ${activeIncident.title}...`}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <Button type="submit" variant="ai" size="sm" disabled={!input.trim() || isGenerating}>
            <Send className="w-3.5 h-3.5" /> Send
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistantPage;
