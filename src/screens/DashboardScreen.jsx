import React, { useState, useEffect } from 'react';
import { 
  Activity, Zap, ArrowUpRight, ArrowDownRight, 
  Server, Database, Network, ShieldCheck,
  Terminal, ShieldAlert, CheckCircle2, Clock, Globe
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export default function DashboardScreen() {
  const { isInfinityMode, dbLogs = [], activeConnections } = useSimulation();
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate live stats from real dbLogs
  const approvedLogs = dbLogs.filter(l => l.resp_code === '00' || l.status === 'APPROVED' || l.status === 'Approved');
  const totalVolume = approvedLogs.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
  const approvalRate = dbLogs.length > 0 ? ((approvedLogs.length / dbLogs.length) * 100).toFixed(1) + '%' : '100%';

  const stats = {
    tps: isInfinityMode ? (Math.random() * 40 + 10).toFixed(1) : (dbLogs.length > 0 ? (dbLogs.length / 60).toFixed(1) : '0.0'),
    volume: '$' + totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    approvalRate: approvalRate,
    activeConnections: activeConnections.length
  };

  const [expandedTxId, setExpandedTxId] = useState(null);

  const safeJsonParse = (data) => {
    if (typeof data !== 'string') return data;
    try {
      return JSON.parse(data);
    } catch(e) {
      return data;
    }
  };

  const recentTransactions = dbLogs.map((log, index) => {
    // Map dbLogs format to dashboard table format
    const isXml = log.request_xml || log.mti?.includes('.');
    const protocol = isXml ? 'ISO 20022' : 'ISO 8583';
    
    // Amount formatting
    let amtStr = log.amount ? parseFloat(log.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
    if (!amtStr.includes('$') && !amtStr.includes('SAR')) {
      amtStr = '$' + amtStr;
    }

    return {
      raw: log,
      protocol,
      id: log.id || log.stan || `tx-${index}`,
      type: log.mti || 'Unknown',
      amount: amtStr,
      status: log.status === 'APPROVED' || log.resp_code === '00' ? 'Approved' : (log.status || 'Declined'),
      code: log.resp_code || 'N/A',
      time: log.created_at ? new Date(log.created_at).toLocaleTimeString() : new Date().toLocaleTimeString()
    };
  }).slice(0, 50); // Show last 50 on dashboard


  return (
    <div className="h-full w-full flex flex-col p-8 space-y-6 overflow-hidden bg-[#030305] text-gray-200 relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-end relative z-10 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
               <Activity size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center">
                Command Center
              </h1>
              <p className="text-[10px] text-cyan-400 font-mono tracking-[0.4em] mt-1 uppercase flex items-center">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse mr-2"></span>
                Transaction Telemetry Active
              </p>
            </div>
          </div>
        </div>
        <div className="flex space-x-8 text-right bg-black/40 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
           <div>
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Local Time</div>
              <div className="text-xs font-mono text-white">{time}</div>
           </div>
           <div className="w-px h-8 bg-white/10"></div>
           <div>
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Network Status</div>
              <div className="text-xs font-mono text-emerald-400 font-bold">ONLINE</div>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 relative z-10 overflow-hidden">
        
        {/* Left Column: Stats & Connections */}
        <div className="col-span-3 flex flex-col space-y-6">
          {/* Metrics */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col space-y-4">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Live Metrics</h2>
            
            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Transactions / Sec</div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-mono text-white">{stats.tps}</div>
                <Zap size={16} className={isInfinityMode ? 'text-yellow-400 animate-pulse' : 'text-gray-600'} />
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Total Settlement Vol</div>
              <div className="flex items-end justify-between">
                <div className="text-xl font-mono text-emerald-400">{stats.volume}</div>
                <ArrowUpRight size={16} className="text-emerald-400" />
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Approval Rate</div>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-mono text-cyan-400">{stats.approvalRate}</div>
                <ShieldCheck size={16} className="text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Connections */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex-1 flex flex-col">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Active Host Nodes</h2>
            <div className="space-y-3 flex-1">
              {activeConnections.includes('Visa') && (
                <div className="bg-black/30 p-3 rounded-lg border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Server size={14} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white uppercase tracking-wider">VISA Base II</div>
                      <div className="text-[9px] text-gray-500 font-mono">TCP : 8583</div>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                </div>
              )}

              {activeConnections.includes('mada') && (
                <div className="bg-black/30 p-3 rounded-lg border border-blue-500/20 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Database size={14} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white uppercase tracking-wider">MADA SPG</div>
                      <div className="text-[9px] text-gray-500 font-mono">TCP : 5000</div>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                </div>
              )}
              
              {activeConnections.includes('Mastercard') && (
                <div className="bg-black/30 p-3 rounded-lg border border-orange-500/20 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Server size={14} className="text-orange-400" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white uppercase tracking-wider">Mastercard GCMS</div>
                      <div className="text-[9px] text-gray-500 font-mono">TCP : 8584</div>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center/Right Column: Live Ledger & Traffic Graph */}
        <div className="col-span-9 flex flex-col space-y-6">
          
          {/* Mock Graph Area */}
          <div className="h-48 glass-panel p-5 rounded-2xl border border-white/5 flex flex-col relative overflow-hidden group">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 relative z-10">Network Traffic Analysis</h2>
            <div className="flex-1 flex items-end space-x-1 opacity-50 group-hover:opacity-100 transition-opacity relative z-10">
              {Array.from({ length: 40 }).map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-gradient-to-t from-blue-500/50 to-cyan-400 rounded-t-sm"
                  style={{ 
                    height: `${isInfinityMode ? Math.random() * 80 + 20 : Math.random() * 20 + 5}%`,
                    transition: 'height 0.5s ease-out'
                  }}
                ></div>
              ))}
            </div>
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
          </div>

          {/* Live Transaction Ledger */}
          <div className="flex-1 glass-panel rounded-2xl border border-white/5 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Real-Time Transaction Ledger</h2>
              <div className="flex items-center space-x-2 text-[9px] font-mono text-cyan-400">
                <Network size={12} />
                <span>Monitoring Port 8583 & API</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar p-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Time</th>
                    <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Protocol</th>
                    <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">STAN / UETR</th>
                    <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Type / MTI</th>
                    <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Amount</th>
                    <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx, idx) => (
                    <React.Fragment key={idx}>
                      <tr 
                        onClick={() => setExpandedTxId(expandedTxId === tx.id ? null : tx.id)} 
                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                      >
                        <td className="p-3 border-b border-white/5">
                          <div className="text-[11px] font-mono text-gray-400 group-hover:text-white transition-colors">{tx.time}</div>
                        </td>
                        <td className="p-3 border-b border-white/5">
                          <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest inline-block
                            ${tx.protocol === 'ISO 20022' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                            {tx.protocol}
                          </div>
                        </td>
                        <td className="p-3 border-b border-white/5">
                          <div className="text-[11px] font-mono text-cyan-400">{tx.id}</div>
                        </td>
                        <td className="p-3 border-b border-white/5">
                          <div className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-gray-300 inline-block">
                            {tx.type}
                          </div>
                        </td>
                        <td className="p-3 border-b border-white/5">
                          <div className="text-[12px] font-mono font-bold text-white">{tx.amount}</div>
                        </td>
                        <td className="p-3 border-b border-white/5">
                          <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-flex
                            ${tx.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                              tx.status === 'Declined' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                              'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                            {tx.status === 'Approved' && <CheckCircle2 size={12} />}
                            {tx.status === 'Declined' && <ShieldAlert size={12} />}
                            {tx.status === 'Reversed' && <ArrowDownRight size={12} />}
                            <span>{tx.status} [{tx.code}]</span>
                          </div>
                        </td>
                      </tr>
                      
                      {expandedTxId === tx.id && (
                        <tr>
                          <td colSpan="6" className="p-0 border-b border-white/5">
                            <div className="bg-black/80 p-6 flex flex-col space-y-4 border-l-4 border-fintech-accent shadow-inner">
                              <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 flex items-center">
                                <Terminal size={14} className="mr-2 text-fintech-accent"/> 
                                Deep Inspection (Hex / XML / JSON)
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                {/* ISO 20022 XML Views */}
                                {tx.protocol === 'ISO 20022' && tx.raw.request_xml && (
                                  <div className="bg-[#0a0a0f] p-4 rounded-xl border border-white/5 col-span-2 md:col-span-1">
                                    <h3 className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-2">Request XML</h3>
                                    <pre className="text-[10px] font-mono text-gray-400 whitespace-pre-wrap overflow-x-auto max-h-48 custom-scrollbar">
                                      {tx.raw.request_xml}
                                    </pre>
                                  </div>
                                )}
                                {tx.protocol === 'ISO 20022' && tx.raw.response_xml && (
                                  <div className="bg-[#0a0a0f] p-4 rounded-xl border border-white/5 col-span-2 md:col-span-1">
                                    <h3 className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Response XML</h3>
                                    <pre className="text-[10px] font-mono text-gray-400 whitespace-pre-wrap overflow-x-auto max-h-48 custom-scrollbar">
                                      {tx.raw.response_xml}
                                    </pre>
                                  </div>
                                )}

                                {/* ISO 8583 Hex Views */}
                                {tx.protocol === 'ISO 8583' && tx.raw.raw_request && (
                                  <div className="bg-[#0a0a0f] p-4 rounded-xl border border-white/5">
                                    <h3 className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mb-2">Raw Request (HEX)</h3>
                                    <div className="text-[11px] font-mono text-gray-300 break-all leading-relaxed">
                                      {tx.raw.raw_request}
                                    </div>
                                  </div>
                                )}
                                {tx.protocol === 'ISO 8583' && tx.raw.raw_response && (
                                  <div className="bg-[#0a0a0f] p-4 rounded-xl border border-white/5">
                                    <h3 className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Raw Response (HEX)</h3>
                                    <div className="text-[11px] font-mono text-gray-300 break-all leading-relaxed">
                                      {tx.raw.raw_response}
                                    </div>
                                  </div>
                                )}
                                
                                {/* ISO 8583 JSON Parsed Views */}
                                {tx.protocol === 'ISO 8583' && tx.raw.parsed_request && (
                                  <div className="bg-[#0a0a0f] p-4 rounded-xl border border-white/5 col-span-2 md:col-span-1">
                                    <h3 className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mb-2">Decoded ISO Fields (Request)</h3>
                                    <pre className="text-[10px] font-mono text-gray-400 whitespace-pre-wrap overflow-x-auto max-h-48 custom-scrollbar">
                                      {JSON.stringify(safeJsonParse(tx.raw.parsed_request), null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {tx.protocol === 'ISO 8583' && tx.raw.parsed_response && (
                                  <div className="bg-[#0a0a0f] p-4 rounded-xl border border-white/5 col-span-2 md:col-span-1">
                                    <h3 className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Decoded ISO Fields (Response)</h3>
                                    <pre className="text-[10px] font-mono text-gray-400 whitespace-pre-wrap overflow-x-auto max-h-48 custom-scrollbar">
                                      {JSON.stringify(safeJsonParse(tx.raw.parsed_response), null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}

                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
