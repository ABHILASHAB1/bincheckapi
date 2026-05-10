import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function LoginScreen() {
  const { login, authError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-fintech-accent to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CONTROL TOWER</h1>
          <p className="text-xs font-mono text-gray-500 mt-1 uppercase tracking-widest">ISO-8583 SIM SECURE LOGIN</p>
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fintech-accent via-purple-500 to-fintech-accent"></div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-fintech-accent focus:ring-1 focus:ring-fintech-accent transition-colors"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-fintech-accent focus:ring-1 focus:ring-fintech-accent transition-colors"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start mt-2">
                <AlertCircle size={16} className="text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-xs text-red-400 leading-snug">{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-fintech-accent to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-semibold rounded-lg py-2.5 text-sm transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)]"
            >
              Authenticate
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center space-x-2 text-[10px] text-gray-500">
            <Clock size={12} />
            <span>Time-bound access enforcement active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
