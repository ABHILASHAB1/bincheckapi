import React, { useState } from 'react';
import { Network, Shield, Link, Unlink, Activity, Save, Key, FileBadge } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export default function TCPConfigScreen() {
  const { tcpConfig, setTcpConfig, tcpStatus, setTcpStatus, tcpPing, setTcpPing } = useSimulation();

  const [errorMsg, setErrorMsg] = useState(null);

  const handleConnect = async () => {
    setErrorMsg(null);
    
    // Strict Validation mimicking VTS / Paragon simulator profiles
    if (!tcpConfig.host) {
      setErrorMsg("Target Host/IP is required.");
      return;
    }
    if (!tcpConfig.port) {
      setErrorMsg("Target Port is required.");
      return;
    }
    
    if (tcpConfig.useTLS) {
      if (!tcpConfig.certificate || tcpConfig.certificate.trim() === '') {
        setErrorMsg("TLS Strict Mode: Client Certificate (.pem/.crt) is mandatory.");
        return;
      }
      if (!tcpConfig.privateKey || tcpConfig.privateKey.trim() === '') {
        setErrorMsg("TLS Strict Mode: Private Key (.key) is mandatory.");
        return;
      }
    }

    setTcpStatus('connecting');

    try {
      const response = await fetch('/api/tcp/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tcpConfig })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTcpStatus('connected');
        setTcpPing(data.ping);
      } else {
        setTcpStatus('disconnected');
        setErrorMsg(`Socket Bind Failed: ${data.error}`);
      }
    } catch (err) {
      setTcpStatus('disconnected');
      setErrorMsg(`API Reachability Error: Backend Offline`);
    }
  };

  const handleDisconnect = () => {
    setTcpStatus('disconnected');
    setTcpPing(0);
    setErrorMsg(null);
  };

  return (
    <div className="h-full w-full flex overflow-hidden p-6 gap-6">
      
      {/* Left Column: Configuration Form */}
      <div className="w-[60%] flex flex-col space-y-6 overflow-y-auto custom-scrollbar pr-2">
        
        {/* Basic TCP Settings */}
        <div className="glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fintech-accent to-blue-500"></div>
          <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center">
              <Network size={16} className="mr-2 text-fintech-accent" />
              Mainframe Routing Target
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">Target Host / IP</label>
                <input 
                  type="text" 
                  value={tcpConfig.host}
                  onChange={e => setTcpConfig({...tcpConfig, host: e.target.value})}
                  className="w-full bg-[#0a0a0f] border border-gray-700 rounded py-2 px-3 text-sm text-gray-100 font-mono focus:outline-none focus:border-fintech-accent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">Target Port</label>
                <input 
                  type="text" 
                  value={tcpConfig.port}
                  onChange={e => setTcpConfig({...tcpConfig, port: e.target.value})}
                  className="w-full bg-[#0a0a0f] border border-gray-700 rounded py-2 px-3 text-sm text-gray-100 font-mono focus:outline-none focus:border-fintech-accent"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">Timeout (ms)</label>
                <input 
                  type="text" 
                  value={tcpConfig.timeout}
                  onChange={e => setTcpConfig({...tcpConfig, timeout: e.target.value})}
                  className="w-full bg-[#0a0a0f] border border-gray-700 rounded py-2 px-3 text-sm text-gray-100 font-mono focus:outline-none focus:border-fintech-accent"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={tcpConfig.keepAlive}
                    onChange={e => setTcpConfig({...tcpConfig, keepAlive: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-700 bg-[#0a0a0f] accent-fintech-accent"
                  />
                  <span className="text-xs text-gray-300">Enable TCP Keep-Alive</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* TLS & Security Settings */}
        <div className="glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center">
              <Shield size={16} className="mr-2 text-purple-400" />
              Transport Layer Security (TLS/SSL)
            </h2>
            <label className="flex items-center space-x-2 cursor-pointer">
              <span className="text-xs text-gray-400 font-medium">Enable mTLS</span>
              <div className={`w-9 h-5 rounded-full relative transition-colors ${tcpConfig.useTLS ? 'bg-purple-500' : 'bg-gray-700'}`}>
                <input type="checkbox" className="sr-only" checked={tcpConfig.useTLS} onChange={e => setTcpConfig({...tcpConfig, useTLS: e.target.checked})} />
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${tcpConfig.useTLS ? 'left-5' : 'left-1'}`}></div>
              </div>
            </label>
          </div>
          
          {tcpConfig.useTLS && (
            <div className="p-5 space-y-4 animate-fadeIn">
              <div>
                <label className="flex items-center text-[10px] font-medium text-gray-400 mb-1">
                  <FileBadge size={12} className="mr-1" /> Client Certificate (.pem / .crt)
                </label>
                <textarea 
                  value={tcpConfig.certificate}
                  onChange={e => setTcpConfig({...tcpConfig, certificate: e.target.value})}
                  placeholder="-----BEGIN CERTIFICATE-----\n..."
                  className="w-full h-24 bg-[#0a0a0f] border border-gray-700 rounded py-2 px-3 text-xs text-gray-400 font-mono focus:outline-none focus:border-purple-500 custom-scrollbar"
                />
              </div>
              <div>
                <label className="flex items-center text-[10px] font-medium text-gray-400 mb-1">
                  <Key size={12} className="mr-1" /> Private Key (.key)
                </label>
                <textarea 
                  value={tcpConfig.privateKey}
                  onChange={e => setTcpConfig({...tcpConfig, privateKey: e.target.value})}
                  placeholder="-----BEGIN PRIVATE KEY-----\n..."
                  className="w-full h-24 bg-[#0a0a0f] border border-gray-700 rounded py-2 px-3 text-xs text-gray-400 font-mono focus:outline-none focus:border-purple-500 custom-scrollbar"
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Right Column: Connection Status & Actions */}
      <div className="w-[40%] flex flex-col gap-6">
        
        {/* Action Panel */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 shadow-2xl flex flex-col space-y-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Connection Control</h3>
          
          <div className="flex space-x-3">
            {tcpStatus !== 'connected' ? (
              <button 
                onClick={handleConnect}
                disabled={tcpStatus === 'connecting'}
                className="flex-1 btn-primary flex items-center justify-center space-x-2 py-3 bg-fintech-green hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tcpStatus === 'connecting' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Link size={16} />
                )}
                <span>{tcpStatus === 'connecting' ? 'Establishing Socket...' : 'Connect to Host'}</span>
              </button>
            ) : (
              <button 
                onClick={handleDisconnect}
                className="flex-1 btn-primary flex items-center justify-center space-x-2 py-3 bg-fintech-red hover:bg-red-700 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                <Unlink size={16} />
                <span>Disconnect Socket</span>
              </button>
            )}
          </div>
          
          {errorMsg && (
            <div className="bg-fintech-red/10 border border-fintech-red/30 rounded-md p-3 animate-fadeIn">
              <div className="text-xs text-fintech-red font-semibold mb-1">Configuration Exception</div>
              <div className="text-[10px] text-gray-300">{errorMsg}</div>
            </div>
          )}
          
          <button className="btn-secondary w-full flex items-center justify-center space-x-2">
            <Save size={14} />
            <span>Save Configuration Profile</span>
          </button>
        </div>

        {/* Live Telemetry Panel */}
        <div className="flex-1 glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl relative flex flex-col">
          <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center">
              <Activity size={16} className="mr-2 text-gray-400" />
              Socket Telemetry
            </h2>
            <div className={`status-badge ${tcpStatus === 'connected' ? 'status-badge-approved' : (tcpStatus === 'connecting' ? 'status-badge-pending' : 'status-badge-declined')}`}>
              <div className={`status-dot ${tcpStatus === 'connected' ? 'status-dot-approved' : (tcpStatus === 'connecting' ? 'status-dot-pending' : 'status-dot-declined')}`}></div>
              <span className="capitalize">{tcpStatus}</span>
            </div>
          </div>
          
          <div className="p-5 flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="relative flex items-center justify-center w-32 h-32">
              {/* Animated Rings */}
              {tcpStatus === 'connected' && (
                <>
                  <div className="absolute inset-0 border-2 border-fintech-green/20 rounded-full animate-ping"></div>
                  <div className="absolute inset-4 border-2 border-fintech-green/40 rounded-full animate-pulse"></div>
                </>
              )}
              {tcpStatus === 'connecting' && (
                <div className="absolute inset-0 border-2 border-fintech-yellow/30 border-t-fintech-yellow rounded-full animate-spin"></div>
              )}
              
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl z-10 transition-colors duration-500
                ${tcpStatus === 'connected' ? 'bg-fintech-green/10 border border-fintech-green/50 text-fintech-green' : 
                  tcpStatus === 'connecting' ? 'bg-fintech-yellow/10 border border-fintech-yellow/50 text-fintech-yellow' : 
                  'bg-black/40 border border-white/10 text-gray-600'}
              `}>
                <Network size={32} />
              </div>
            </div>

            {tcpStatus === 'connected' ? (
              <div className="w-full space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center px-4 py-2 bg-black/30 rounded border border-white/5">
                  <span className="text-xs text-gray-400">Latency</span>
                  <span className="text-sm font-mono text-fintech-green">{tcpPing} ms</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2 bg-black/30 rounded border border-white/5">
                  <span className="text-xs text-gray-400">Uptime</span>
                  <span className="text-sm font-mono text-gray-200">00:02:45</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2 bg-black/30 rounded border border-white/5">
                  <span className="text-xs text-gray-400">Cipher Suite</span>
                  <span className="text-[10px] font-mono text-purple-400">{tcpConfig.useTLS ? 'TLS_AES_256_GCM_SHA384' : 'NONE'}</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-gray-500 italic px-8">
                Socket is currently unbound. Configure host details and establish a connection to begin transmission.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
