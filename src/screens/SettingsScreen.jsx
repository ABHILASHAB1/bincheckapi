import React, { useState } from 'react';
import { Settings, Save, RotateCcw } from 'lucide-react';

function SettingsScreen() {
  const [config, setConfig] = useState({
    defaultScheme: 'Visa',
    defaultMTI: '0100',
    defaultCurrency: '840',
    autoSTAN: true,
    autoTimestamp: true,
    maxBatchSize: 1000,
    defaultPosEntry: '051',
    simulateLatency: true,
    latencyMin: 50,
    latencyMax: 300,
  });

  const update = (key, val) => setConfig(p => ({ ...p, [key]: val }));

  return (
    <div className="h-full w-full flex overflow-hidden p-6 gap-6">
      <div className="flex-1 max-w-2xl mx-auto flex flex-col glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-500 to-gray-400"></div>
        <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center">
            <Settings size={16} className="mr-2 text-gray-400" />Simulator Settings
          </h2>
          <div className="flex space-x-2">
            <button className="btn-secondary text-xs py-1 px-3 flex items-center"><RotateCcw size={12} className="mr-1" /> Reset</button>
            <button className="btn-primary text-xs py-1 px-3 flex items-center"><Save size={12} className="mr-1" /> Save</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Default Transaction Values</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Default Scheme</label>
                <select value={config.defaultScheme} onChange={e => update('defaultScheme', e.target.value)} className="w-full bg-[#0a0a0f] border border-gray-700 rounded py-1.5 px-3 text-xs text-gray-200 focus:outline-none focus:border-fintech-accent">
                  <option>Visa</option><option>Mastercard</option><option>mada</option>
                </select></div>
              <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Default MTI</label>
                <select value={config.defaultMTI} onChange={e => update('defaultMTI', e.target.value)} className="w-full bg-[#0a0a0f] border border-gray-700 rounded py-1.5 px-3 text-xs text-gray-200 font-mono focus:outline-none focus:border-fintech-accent">
                  <option value="0100">0100 - Auth Request</option><option value="0110">0110 - Auth Response</option>
                  <option value="0200">0200 - Financial Request (mada)</option><option value="0220">0220 - Completion</option>
                  <option value="0400">0400 - Reversal</option><option value="0420">0420 - Reversal Advice</option>
                </select></div>
              <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Currency (DE49)</label>
                <select value={config.defaultCurrency} onChange={e => update('defaultCurrency', e.target.value)} className="w-full bg-[#0a0a0f] border border-gray-700 rounded py-1.5 px-3 text-xs text-gray-200 font-mono focus:outline-none focus:border-fintech-accent">
                  <option value="682">682 - SAR (mada)</option><option value="840">840 - USD</option><option value="978">978 - EUR</option><option value="826">826 - GBP</option><option value="356">356 - INR</option>
                </select></div>
              <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">POS Entry Mode (DE22)</label>
                <select value={config.defaultPosEntry} onChange={e => update('defaultPosEntry', e.target.value)} className="w-full bg-[#0a0a0f] border border-gray-700 rounded py-1.5 px-3 text-xs text-gray-200 font-mono focus:outline-none focus:border-fintech-accent">
                  <option value="051">051 - Chip, PIN verified</option><option value="071">071 - Contactless</option>
                  <option value="812">812 - E-Commerce</option><option value="010">010 - Manual entry</option>
                </select></div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Auto-generation</h3>
            <div className="space-y-3">
              {[['autoSTAN', 'Auto-generate STAN (DE11)'], ['autoTimestamp', 'Auto-generate Timestamp (DE7)']].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-lg">
                  <span className="text-xs text-gray-300">{label}</span>
                  <button onClick={() => update(key, !config[key])} className={'w-9 h-5 rounded-full relative transition-colors ' + (config[key] ? 'bg-fintech-accent' : 'bg-gray-700')}>
                    <div className={'w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ' + (config[key] ? 'left-5' : 'left-1')}></div>
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Simulation</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-lg">
                <span className="text-xs text-gray-300">Simulate Network Latency</span>
                <button onClick={() => update('simulateLatency', !config.simulateLatency)} className={'w-9 h-5 rounded-full relative transition-colors ' + (config.simulateLatency ? 'bg-fintech-accent' : 'bg-gray-700')}>
                  <div className={'w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ' + (config.simulateLatency ? 'left-5' : 'left-1')}></div>
                </button>
              </div>
              <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Max Batch Size</label>
                <input type="number" value={config.maxBatchSize} onChange={e => update('maxBatchSize', parseInt(e.target.value))}
                  className="w-full bg-[#0a0a0f] border border-gray-700 rounded py-1.5 px-3 text-xs text-gray-200 font-mono focus:outline-none focus:border-fintech-accent" /></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default SettingsScreen;
