import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Settings, Activity, UserPlus, Trash2, Clock, 
  CheckCircle2, XCircle, Database, Lock, Key, Globe, Cpu, RefreshCw, Zap, Server
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSimulation } from '../context/SimulationContext';

function AdminPanelScreen() {
  const { users, auditLogs, createUser, updateUser, deleteUser } = useAuth();
  const { transactions } = useSimulation();
  const [activeTab, setActiveTab] = useState('governance');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleCreateUser = (e) => {
    e.preventDefault();
    createUser({ username: newUsername, password: newPassword, role: 'user', isDisabled: false });
    setNewUsername('');
    setNewPassword('');
  };

  const handleImportBins = async () => {
    setIsImporting(true);
    try {
      const res = await fetch('/api/bins/import-csv', { method: 'POST' });
      const data = await res.json();
      setImportResult(data);
    } catch (e) { setImportResult({ error: e.message }); }
    finally { setIsImporting(false); }
  };

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#050508] relative">
      {/* Background Security Grid */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {/* SOC Header */}
      <div className="flex justify-between items-end relative z-10 border-b border-white/5 pb-6">
        <div>
           <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-fintech-green animate-pulse"></div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">SOC Operating Standard: ALPHA_SEC</span>
           </div>
           <h1 className="text-4xl font-black text-white flex items-center tracking-tighter">
             <Shield size={36} className="mr-4 text-fintech-accent" />
             Security Operations Center
           </h1>
        </div>
        
        <div className="flex bg-white/[0.02] p-1.5 rounded-2xl border border-white/5 backdrop-blur-3xl">
          {[
            { id: 'governance', label: 'Governance', icon: Users },
            { id: 'hsm', label: 'Security (HSM)', icon: Lock },
            { id: 'audit', label: 'Audit Trail', icon: Activity }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest
                ${activeTab === tab.id ? 'bg-fintech-accent text-white shadow-lg' : 'text-gray-500 hover:text-white'}
              `}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Infrastructure Vitals Bar */}
      <div className="grid grid-cols-4 gap-6 relative z-10">
         <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-4">
               <div className="p-3 rounded-xl bg-fintech-accent/10 text-fintech-accent"><Globe size={20} /></div>
               <div>
                  <div className="text-[8px] text-gray-500 font-black uppercase">Supabase Cloud Link</div>
                  <div className="text-xs font-black text-fintech-green uppercase tracking-widest">Active & Syncing</div>
               </div>
            </div>
            <Zap size={14} className="text-fintech-green animate-pulse" />
         </div>
         <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-4">
               <div className="p-3 rounded-xl bg-fintech-green/10 text-fintech-green"><Lock size={20} /></div>
               <div>
                  <div className="text-[8px] text-gray-500 font-black uppercase">HSM Integrity</div>
                  <div className="text-xs font-black text-white uppercase tracking-widest">TLS 1.3 Secure</div>
               </div>
            </div>
            <CheckCircle2 size={14} className="text-fintech-green" />
         </div>
         <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-4">
               <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500"><Server size={20} /></div>
               <div>
                  <div className="text-[8px] text-gray-500 font-black uppercase">Switch Core</div>
                  <div className="text-xs font-black text-white uppercase tracking-widest">Node.js Engine</div>
               </div>
            </div>
            <div className="text-[9px] font-mono text-orange-500">3001_v1</div>
         </div>
         <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-4">
               <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500"><Key size={20} /></div>
               <div>
                  <div className="text-[8px] text-gray-500 font-black uppercase">Key Store</div>
                  <div className="text-xs font-black text-white uppercase tracking-widest">ZMK Rotation Ready</div>
               </div>
            </div>
            <RefreshCw size={14} className="text-purple-500 animate-spin-slow" />
         </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden relative z-10">
        {activeTab === 'governance' && (
          <div className="flex-1 flex gap-6 overflow-hidden animate-slideUp">
            {/* User Matrix */}
            <div className="flex-1 glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col bg-black/40">
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Identity Nodes</h2>
                <div className="flex items-center space-x-2 text-[10px] font-black text-fintech-accent uppercase">
                   <Users size={14} />
                   <span>{Object.keys(users).length} Records</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                {Object.values(users).map(user => (
                    <div key={user.username} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 flex items-center justify-between group hover:border-fintech-accent/30 transition-all">
                      <div className="flex items-center space-x-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${user.isDisabled ? 'border-red-500/20 text-red-500' : 'border-fintech-accent/20 text-fintech-accent group-hover:bg-fintech-accent/10'}`}>
                          <Users size={28} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3">
                            <span className="font-black text-white text-xl tracking-tighter">{user.username}</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${user.isDisabled ? 'text-red-400 border-red-400/20 bg-red-400/5' : 'text-fintech-green border-fintech-green/20 bg-fintech-green/5'}`}>
                              {user.isDisabled ? 'DEACTIVATED' : 'PROVISIONED'}
                            </span>
                          </div>
                          <div className="text-[9px] text-gray-500 mt-1.5 font-mono uppercase tracking-widest font-bold">Access Layer: {user.role} | Node ID: {user.username.toUpperCase()}_01</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => updateUser(user.username, { isDisabled: !user.isDisabled })}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${user.isDisabled ? 'bg-fintech-green/10 border-fintech-green/20 text-fintech-green' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
                        >
                          {user.isDisabled ? 'Restore' : 'Revoke'}
                        </button>
                        {user.username !== 'admin' && (
                          <button onClick={() => deleteUser(user.username)} className="p-3 rounded-xl border border-white/5 bg-white/5 text-gray-400 hover:bg-red-500 hover:text-white transition-all">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                ))}
              </div>
            </div>

            {/* Ingestion Panel */}
            <div className="w-96 space-y-6">
               <div className="glass-panel rounded-[2.5rem] border border-white/5 p-8 bg-black/40">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Provision Identity</h3>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                     <input value={newUsername} onChange={e=>setNewUsername(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:border-fintech-accent outline-none" placeholder="Identity Handle" required />
                     <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:border-fintech-accent outline-none" placeholder="Security Token" required />
                     <button type="submit" className="w-full py-4 bg-fintech-accent text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-fintech-accent/20">Authorize Node</button>
                  </form>
               </div>
               
               <div className="glass-panel rounded-[2.5rem] border border-white/5 p-8 bg-black/40">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex justify-between">
                     <span>Atomic Ingestion</span>
                     {isImporting && <RefreshCw size={12} className="animate-spin text-orange-500" />}
                  </h3>
                  <div className="flex items-center justify-between p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl mb-6">
                     <div className="text-[9px] text-orange-500 font-bold uppercase tracking-wider">Local Repository Update</div>
                     <button onClick={handleImportBins} disabled={isImporting} className="p-2 bg-orange-500 text-white rounded-lg hover:scale-110 transition-all"><Database size={16} /></button>
                  </div>
                  {importResult && (
                    <div className="text-[10px] font-mono text-gray-400 bg-white/5 p-4 rounded-xl border border-white/5">
                       {importResult.error ? `ERR: ${importResult.error}` : `SUCCESS: ${importResult.total} records`}
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="flex-1 glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col bg-black/40 animate-slideUp">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Immutable Security Logs</h2>
              <Activity size={16} className="text-fintech-accent" />
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02] text-[9px] text-gray-500 uppercase tracking-[0.2em] font-black sticky top-0">
                  <tr>
                    <th className="p-6">Timestamp</th>
                    <th className="p-6">Actor</th>
                    <th className="p-6">Operation</th>
                    <th className="p-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[10px] text-gray-400">
                  {auditLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-all group">
                      <td className="p-6 font-bold">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-6"><span className="text-fintech-accent font-black uppercase">{log.actor}</span></td>
                      <td className="p-6 text-white font-bold">{log.action}</td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded border font-black ${log.status === 'SUCCESS' ? 'text-fintech-green border-fintech-green/20 bg-fintech-green/5' : 'text-red-500 border-red-500/20 bg-red-500/5'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'hsm' && (
           <div className="flex-1 glass-panel rounded-[2.5rem] border border-white/5 p-12 bg-black/40 flex flex-col justify-center items-center text-center animate-slideUp">
              <div className="w-24 h-24 bg-fintech-accent/10 rounded-[2rem] border border-fintech-accent/20 flex items-center justify-center text-fintech-accent mb-8 shadow-2xl shadow-fintech-accent/20">
                 <Lock size={48} />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter mb-4 uppercase">HSM Cluster Virtualization</h2>
              <p className="text-sm text-gray-500 max-w-lg mb-10 font-medium">
                 The platform is currently operating in **Software Emulation Mode** (SEM). All ZMK, TMK, and PVK keys are isolated within a virtualized HSM enclave.
              </p>
              <div className="grid grid-cols-3 gap-6 w-full max-w-3xl">
                 {[
                    { label: 'Master Key', state: 'LOADED', color: 'text-fintech-green' },
                    { label: 'Session Buffer', state: 'CLEAR', color: 'text-fintech-green' },
                    { label: 'ZMK State', state: 'PENDING_ROT', color: 'text-orange-500' }
                 ].map(k => (
                    <div key={k.label} className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                       <div className="text-[10px] text-gray-600 font-black uppercase mb-1">{k.label}</div>
                       <div className={`text-xs font-black uppercase tracking-widest ${k.color}`}>{k.state}</div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanelScreen;
