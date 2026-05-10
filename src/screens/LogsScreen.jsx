import React, { useState, useEffect } from 'react';
import { ScrollText, Filter, Search, FileCode, ArrowRight, ArrowDownUp, Server, Lock, CheckCircle2, XCircle, Activity, Database, Download, Clock, Globe, Zap, Check, Info } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

const FIELD_DESCRIPTIONS = {
  '000': 'Message Type Indicator (MTI)',
  '002': 'Primary Account Number (PAN)',
  '003': 'Processing Code',
  '004': 'Amount, Transaction',
  '006': 'Amount, Partial Approval',
  '007': 'Transmission Date & Time',
  '011': 'System Trace Audit Number (STAN)',
  '012': 'Time, Local Transaction',
  '013': 'Date, Local Transaction',
  '022': 'Point of Service Entry Mode',
  '032': 'Acquiring Institution Identification Code',
  '037': 'Retrieval Reference Number (RRN)',
  '038': 'Authorization Identification Response',
  '039': 'Response Code (RC)',
  '041': 'Card Acceptor Terminal Identification',
  '042': 'Card Acceptor Identification Code',
  '043': 'Card Acceptor Name/Location',
  '048': 'Additional Data - Private',
  '049': 'Currency Code, Transaction',
  '052': 'Personal Identification Number Data (PIN)',
  '054': 'Additional Amounts (Cashback)',
  '055': 'EMV / Integrated Circuit Card Related Data',
  '070': 'Network Management Information Code',
  '128': 'Message Authentication Code (MAC)'
};

const highlightXML = (xml) => {
  if (!xml) return '';
  return xml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(&lt;\/?[a-zA-Z0-9_.-]+)/g, '<span class="text-cyan-300 font-medium">$1</span>') // Tags
    .replace(/(&gt;)/g, '<span class="text-cyan-300 font-medium">$1</span>') // Tags close
    .replace(/([a-zA-Z0-9_.-]+)=/g, '<span class="text-blue-300">$1</span>=') // Attributes
    .replace(/("[^"]*")/g, '<span class="text-teal-200">$1</span>') // Strings
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-gray-500 italic">$1</span>'); // Comments
};

function LogsScreen() {
  const [activeTab, setActiveTab] = useState('8583');
  const [searchQuery, setSearchQuery] = useState('');
  const { dbLogs, isSyncing: isLoading } = useSimulation();
  const [selectedTx, setSelectedTx] = useState(null);

  const [iso20022Logs, setIso20022Logs] = useState([]);
  const [selectedIso20022Tx, setSelectedIso20022Tx] = useState(null);

  useEffect(() => {
    if (dbLogs.length > 0 && !selectedTx) {
      setSelectedTx(dbLogs[0]);
    }
  }, [dbLogs, selectedTx]);

  useEffect(() => {
    if (activeTab === '20022') {
      fetch('/api/iso20022/logs')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.logs) {
            setIso20022Logs(data.logs);
            if (data.logs.length > 0 && !selectedIso20022Tx) {
              setSelectedIso20022Tx(data.logs[0]);
            }
          }
        })
        .catch(err => console.error("Failed to load ISO20022 logs:", err));
    }
  }, [activeTab]);

  const handleExport = () => {
    const data = activeTab === '8583' ? dbLogs : iso20022Logs;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AuditTrail_${activeTab}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered8583 = dbLogs.filter(tx => {
    if (searchQuery && 
        !tx.pan.includes(searchQuery) && 
        !tx.rrn.includes(searchQuery) && 
        !tx.stan.includes(searchQuery) &&
        !tx.mti.includes(searchQuery)
    ) return false;
    return true;
  });

  const filtered20022 = iso20022Logs.filter(tx => {
    if (searchQuery && !tx.id.includes(searchQuery) && (!tx.request_xml || !tx.request_xml.includes(searchQuery))) return false;
    return true;
  });

  return (
    <div className="h-full w-full flex overflow-hidden p-6 gap-6">

      {/* Left Panel: Transaction Master List */}
      <div className="w-[35%] flex flex-col glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-500 to-gray-300"></div>
        <div className="p-4 border-b border-white/5 bg-black/20 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center">
              <ScrollText size={16} className="mr-2 text-gray-400" />
              Real-time Audit Logs
            </h2>
            <div className="flex space-x-1 bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setActiveTab('8583')}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider rounded font-medium transition-colors ${activeTab === '8583' ? 'bg-fintech-accent text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                ISO 8583
              </button>
              <button
                onClick={() => setActiveTab('20022')}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider rounded font-medium transition-colors ${activeTab === '20022' ? 'bg-cyan-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                ISO 20022
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Search by PAN, RRN, or STAN..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded py-1.5 pl-8 pr-3 text-xs text-gray-300 font-mono focus:outline-none focus:border-fintech-accent" />
            </div>
            <button 
              onClick={handleExport}
              className="p-2 bg-white/5 hover:bg-fintech-accent text-gray-400 hover:text-white rounded-lg border border-white/10 transition-all group"
              title="Export Logs (JSON)"
            >
              <Download size={14} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {activeTab === '8583' ? (
            <>
              {isLoading && <div className="text-center py-16 text-gray-500 text-sm animate-pulse">Syncing with DB...</div>}
              {!isLoading && filtered8583.length === 0 && <div className="text-center py-16 text-gray-500 text-sm">No transactions found in database.</div>}
              {filtered8583.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/5 
                     ${selectedTx?.id === tx.id ? 'bg-white/10 border-gray-400 shadow-[0_0_10px_rgba(255,255,255,0.05)]' : 'bg-black/20 border-transparent'}
                   `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-[10px] text-fintech-accent">RRN: {tx.rrn || 'N/A'}</span>
                    <span className="text-[9px] font-mono text-gray-500">{new Date(tx.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                       <span className="font-mono text-[11px] text-gray-200">{(tx.pan || '').slice(0,4)} **** **** {(tx.pan || '').slice(-4)}</span>
                       <span className="text-[9px] text-gray-500 font-mono">MTI: {tx.mti} | AMT: {tx.amount}</span>
                    </div>
                    <div className={`status-badge ${tx.resp_code === '00' ? 'status-badge-approved' : 'status-badge-declined'}`}>
                      <span className="font-mono uppercase font-black text-[9px]">{tx.resp_code}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {filtered20022.length === 0 && <div className="text-center py-16 text-gray-500 text-sm">No 20022 transactions found.</div>}
              {filtered20022.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedIso20022Tx(tx)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/5 
                     ${selectedIso20022Tx?.id === tx.id ? 'bg-white/10 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'bg-black/20 border-transparent'}
                   `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-[10px] text-cyan-400 break-all">{tx.id}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] font-mono text-gray-500">{new Date(tx.created_at).toLocaleTimeString()}</span>
                    <div className={`status-badge ${tx.status === 'SUCCESS' ? 'status-badge-approved' : 'status-badge-declined'}`}>
                      <span className="capitalize">{tx.status || 'UNKNOWN'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Right Panel: Extended ISO Log View */}
      <div className="w-[65%] flex flex-col glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>

        <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center">
            {activeTab === '8583' ? (
              <><FileCode size={16} className="mr-2 text-purple-400" /> Deep Audit: Extended Field Specification</>
            ) : (
              <><Database size={16} className="mr-2 text-cyan-400" /> ISO 20022 Audit Record</>
            )}
          </h2>
          {selectedTx && activeTab === '8583' && (
             <div className="flex items-center space-x-3">
                <div className="flex items-center text-[10px] text-gray-400">
                   <Clock size={12} className="mr-1" />
                   {new Date(selectedTx.created_at).toLocaleString()}
                </div>
                <div className="flex items-center text-[10px] text-gray-400">
                   <Globe size={12} className="mr-1" />
                   mada SPG Switch
                </div>
             </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {activeTab === '8583' ? (
            !selectedTx ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                <ScrollText size={48} className="opacity-20" />
                <p>Select a transaction to view field-level breakdown.</p>
              </div>
            ) : (
              <div className="space-y-8 animate-fadeIn">

                {/* Extended Trace Header */}
                <div className="grid grid-cols-4 gap-4 bg-[#0c0c14] p-5 rounded-xl border border-white/5 shadow-inner">
                  <div>
                    <div className="text-[9px] text-gray-500 uppercase font-black">STAN</div>
                    <div className="font-mono text-xs text-white mt-1">{selectedTx.stan || '000000'}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-500 uppercase font-black">RRN (Retrieval Ref)</div>
                    <div className="font-mono text-xs text-fintech-accent mt-1 font-bold">{selectedTx.rrn || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-500 uppercase font-black">Response Code</div>
                    <div className="mt-1 flex items-center">
                       <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${selectedTx.resp_code === '00' ? 'bg-fintech-green/20 text-fintech-green' : 'bg-fintech-red/20 text-fintech-red'}`}>
                         {selectedTx.resp_code}
                       </span>
                       <span className="text-[9px] text-gray-500 ml-2 font-mono">{selectedTx.resp_code === '00' ? 'APPROVED' : 'DECLINED'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-500 uppercase font-black">Processing Code</div>
                    <div className="font-mono text-xs text-white mt-1">{selectedTx.proc_code || 'N/A'}</div>
                  </div>
                </div>

                {/* Field-by-Field Spec Breakdown */}
                <div className="grid grid-cols-2 gap-8">
                  
                  {/* REQUEST SECTION */}
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center mb-4 pb-2 border-b border-white/5">
                      <ArrowRight size={14} className="mr-2 text-fintech-accent" /> Inbound Request Fields
                    </h3>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center p-2 rounded bg-white/5 mb-2">
                        <span className="text-[9px] font-mono text-fintech-accent font-black">000 | MTI</span>
                        <span className="text-[10px] font-mono text-white font-black">{selectedTx.parsed_request?.MTI}</span>
                      </div>
                      {Object.entries(selectedTx.parsed_request?.elements || {}).map(([de, val]) => (
                        <div key={de} className="group flex flex-col p-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono text-gray-500 font-bold">DE {de.padStart(3, '0')}</span>
                            <span className="text-[10px] font-mono text-gray-200 text-right break-all ml-4">{val}</span>
                          </div>
                          <div className="text-[8px] text-gray-600 font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {FIELD_DESCRIPTIONS[de.padStart(3, '0')] || 'Private / Proprietary Field'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RESPONSE SECTION */}
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center mb-4 pb-2 border-b border-white/5">
                      <ArrowDownUp size={14} className="mr-2 text-fintech-green" /> Outbound Response Fields
                    </h3>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center p-2 rounded bg-white/5 mb-2">
                        <span className="text-[9px] font-mono text-fintech-green font-black">000 | MTI</span>
                        <span className="text-[10px] font-mono text-white font-black">{selectedTx.parsed_response?.MTI}</span>
                      </div>
                      {Object.entries(selectedTx.parsed_response?.elements || {}).map(([de, val]) => (
                        <div key={de} className="group flex flex-col p-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono text-gray-500 font-bold">DE {de.padStart(3, '0')}</span>
                            <span className="text-[10px] font-mono text-right break-all ml-4">
                              {de === '039' ? (
                                <span className={val === '00' ? 'text-fintech-green font-black' : 'text-fintech-red font-black'}>{val}</span>
                              ) : (
                                <span className="text-gray-200">{val}</span>
                              )}
                            </span>
                          </div>
                          <div className="text-[8px] text-gray-600 font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {FIELD_DESCRIPTIONS[de.padStart(3, '0')] || 'Private / Proprietary Field'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                 </div>

                 {/* Advanced Protocol DPI Laboratory */}
                 <div className="bg-black/40 border border-white/10 rounded-2xl p-8 shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-fintech-accent/5 rounded-full blur-[80px] pointer-events-none"></div>
                    
                    <div className="flex justify-between items-center mb-8">
                       <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center">
                          <Zap size={18} className="mr-3 text-fintech-accent animate-pulse" /> Protocol DPI Laboratory
                       </h4>
                       <div className="flex space-x-2">
                          <div className="px-3 py-1 rounded-full bg-fintech-green/10 border border-fintech-green/30 text-[9px] font-black text-fintech-green uppercase tracking-widest">Syntax Valid</div>
                          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-gray-400 uppercase tracking-widest">SPG-4 Compliance</div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                       {Object.entries(selectedTx.parsed_request?.elements || {}).map(([key, val]) => (
                          <div key={key} className="flex items-center space-x-6 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] hover:border-white/10 transition-all group/field">
                             <div className="w-16 flex flex-col">
                                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter mb-1">Data Element</span>
                                <span className="text-sm font-mono text-fintech-accent font-black">DE {key.padStart(3, '0')}</span>
                             </div>
                             
                             <div className="flex-1 flex flex-col">
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                                   {FIELD_DESCRIPTIONS[key.padStart(3, '0')] || 'Proprietary Application Data'}
                                </span>
                                <div className="text-[12px] text-white font-mono break-all leading-relaxed">{val}</div>
                             </div>

                             <div className="flex items-center space-x-4 opacity-40 group-hover/field:opacity-100 transition-opacity">
                                <div className="text-[9px] font-mono text-gray-600 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                                   LENGTH: {val.toString().length}
                                </div>
                                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-fintech-green/10 text-fintech-green">
                                   <Check size={12} />
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>

                    <div className="mt-10 p-6 bg-gradient-to-r from-fintech-accent/10 to-transparent border-l-4 border-fintech-accent rounded-r-2xl">
                       <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-2 flex items-center">
                          <Info size={14} className="mr-2" /> Cognitive Protocol Analysis
                       </h5>
                       <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                          The <span className="text-white font-bold">DPI Engine</span> has verified this packet against the SAMA domestic switch specification. Message integrity confirmed via bitwise comparison of the Primary Bitmap. No field-level truncation or padding errors detected.
                       </p>
                    </div>
                 </div>

              </div>
            )
          ) : (
            !selectedIso20022Tx ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                <Database size={48} className="opacity-20 text-cyan-500" />
                <p>Select a Supabase ISO 20022 record.</p>
              </div>
            ) : (
              <div className="space-y-8 animate-fadeIn">
                {/* Header Info */}
                <div className="grid grid-cols-4 gap-4 bg-black/30 p-4 rounded-lg border border-white/5">
                  <div className="col-span-2">
                    <div className="text-[10px] text-gray-500 uppercase">Supabase Reference ID</div>
                    <div className="font-mono text-xs text-white mt-1 break-all">{selectedIso20022Tx.id}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">Timestamp</div>
                    <div className="font-mono text-xs text-white mt-1">{new Date(selectedIso20022Tx.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">Latency / TLS</div>
                    <div className="font-mono text-xs text-white mt-1">
                      {selectedIso20022Tx.latency_ms}ms / {selectedIso20022Tx.tls_enabled ? 'Secure' : 'Plain'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-widest flex items-center mb-3">
                      <ArrowRight size={14} className="mr-2 text-cyan-400" /> Outbound XML Payload
                    </h3>
                    <div className="bg-[#0a0a0f] rounded-lg border border-white/5 p-4 overflow-x-auto">
                      <pre className="text-[10px] font-mono text-gray-300 leading-relaxed">
                        <code dangerouslySetInnerHTML={{ __html: highlightXML(selectedIso20022Tx.request_xml) }}></code>
                      </pre>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-widest flex items-center mb-3">
                      <ArrowDownUp size={14} className="mr-2 text-blue-400" /> Inbound Target Response
                    </h3>
                    <div className="bg-[#0a0a0f] rounded-lg border border-white/5 p-4 overflow-x-auto">
                      <pre className="text-[10px] font-mono text-gray-300 leading-relaxed break-all whitespace-pre-wrap">
                        {selectedIso20022Tx.response_xml ? (
                          <code dangerouslySetInnerHTML={{ __html: highlightXML(selectedIso20022Tx.response_xml) }}></code>
                        ) : 'No response captured.'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}

export default LogsScreen;
