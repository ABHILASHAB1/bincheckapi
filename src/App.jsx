import React, { useState } from 'react';
import { 
  Activity, Code, TerminalSquare, ShieldCheck, FileLock2, CreditCard, Wallet, ScrollText, Settings,
  Search, Play, Database, Clock, LogOut, ShieldAlert, Gauge, Tablet, Smartphone, Columns2, Globe, Share2, Mic, Map, Terminal,
  Brain, Landmark, Home, Briefcase, Award, FileText
} from 'lucide-react';

import DashboardScreen from './screens/DashboardScreen';
import ISOBuilderScreen from './screens/ISOBuilderScreen';
import TransactionSimulatorScreen from './screens/TransactionSimulatorScreen';
import CryptographyLabScreen from './screens/CryptographyLabScreen';
import SchemeRulesScreen from './screens/SchemeRulesScreen';
import ThreeDSFlowScreen from './screens/ThreeDSFlowScreen';
import SettlementScreen from './screens/SettlementScreen';
import LogsScreen from './screens/LogsScreen';
import SettingsScreen from './screens/SettingsScreen';
import BINCheckerScreen from './screens/BINCheckerScreen';
import TestCardVaultScreen from './screens/TestCardVaultScreen';
import TCPConfigScreen from './screens/TCPConfigScreen';
import ISO20022BuilderScreen from './screens/ISO20022BuilderScreen';
import LoginScreen from './screens/LoginScreen';
import AdminPanelScreen from './screens/AdminPanelScreen';
import LoadTestingScreen from './screens/LoadTestingScreen';
import BackgroundParticles from './components/BackgroundParticles';
import SystemDiagnosticsModal from './components/SystemDiagnosticsModal';
import MessageDiffScreen from './screens/MessageDiffScreen';
import VirtualTerminal from './components/VirtualTerminal';
import DataExplorerScreen from './screens/DataExplorerScreen';
import ComplianceAuditorScreen from './screens/ComplianceAuditorScreen';
import RemittanceDashboard from './screens/RemittanceDashboard';
import NetworkTopologyScreen from './screens/NetworkTopologyScreen';
import FraudMonitorScreen from './screens/FraudMonitorScreen';
import LiquidityGlobeScreen from './screens/LiquidityGlobeScreen';
import APIExplorerScreen from './screens/APIExplorerScreen';
import ReceiptGalleryScreen from './screens/ReceiptGalleryScreen';
import PaymentGatewayScreen from './screens/PaymentGatewayScreen';
import TelemetryScreen from './screens/TelemetryScreen';
import TokenLifecycleScreen from './screens/TokenLifecycleScreen';
import NeuralIngestionScreen from './screens/NeuralIngestionScreen';
import ProjectIntelligenceScreen from './screens/ProjectIntelligenceScreen';
import BankingIntelligenceScreen from './screens/BankingIntelligenceScreen';
import RealEstateIntelligenceScreen from './screens/RealEstateIntelligenceScreen';
import ExecutiveConsultingScreen from './screens/ExecutiveConsultingScreen';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const NAV_CATEGORIES = [
  {
    title: 'GLOBAL INTELLIGENCE',
    items: [
      { id: 'dashboard', label: 'Executive Command', icon: Activity },
      { id: 'neural-ingestion', label: 'Neural Data Ingestion', icon: Brain },
      { id: 'globe', label: 'Global Intelligence Map', icon: Map },
      { id: 'telemetry', label: 'Network Pulse', icon: Gauge },
    ]
  },
  {
    title: 'FINANCIAL OPERATIONS',
    items: [
      { id: 'banking', label: 'Banking & Treasury', icon: Landmark },
      { id: 'gateway', label: 'Payment Gateway', icon: Wallet },
      { id: 'tokens', label: 'TSP Token Lifecycle', icon: Smartphone },
      { id: 'settlement', label: 'Clearing & Settlement', icon: ScrollText },
      { id: 'fraud', label: 'Risk & Fraud AI', icon: ShieldAlert },
    ]
  },
  {
    title: 'PROJECT & ASSET CONTROL',
    items: [
      { id: 'projects', label: 'Project Portfolio', icon: Briefcase },
      { id: 'real-estate', label: 'Real Estate Valuation', icon: Home },
      { id: 'iso-builder', label: 'Message Engineering', icon: Code },
    ]
  },
  {
    title: 'EXECUTIVE STRATEGY',
    items: [
      { id: 'consulting', label: 'Strategic Advisory', icon: Award },
      { id: 'compliance', label: 'Regulatory Audit', icon: ShieldCheck },
      { id: 'logs', label: 'Audit Intelligence', icon: FileText },
      { id: 'settings', label: 'System Configuration', icon: Settings },
    ]
  }
];

const SCREEN_MAP = {
  'dashboard': DashboardScreen,
  'neural-ingestion': NeuralIngestionScreen,
  'banking': BankingIntelligenceScreen,
  'projects': ProjectIntelligenceScreen,
  'real-estate': RealEstateIntelligenceScreen,
  'consulting': ExecutiveConsultingScreen,
  'gateway': PaymentGatewayScreen,
  'tokens': TokenLifecycleScreen,
  'telemetry': TelemetryScreen,
  'receipts': ReceiptGalleryScreen,
  'api-explorer': APIExplorerScreen,
  'globe': LiquidityGlobeScreen,
  'fraud': FraudMonitorScreen,
  'topology': NetworkTopologyScreen,
  'remittance': RemittanceDashboard,
  'iso-builder': ISOBuilderScreen,
  'iso-20022': ISO20022BuilderScreen,
  'simulator': TransactionSimulatorScreen,
  'load-test': LoadTestingScreen,
  'crypto': CryptographyLabScreen,
  'scheme': SchemeRulesScreen,
  '3ds': ThreeDSFlowScreen,
  'test-cards': TestCardVaultScreen,
  'bin-checker': BINCheckerScreen,
  'tcp-config': TCPConfigScreen,
  'settlement': SettlementScreen,
  'logs': LogsScreen,
  'settings': SettingsScreen,
  'diff': MessageDiffScreen,
  'explorer': DataExplorerScreen,
  'compliance': ComplianceAuditorScreen,
  'admin': AdminPanelScreen,
};

function AppContent() {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [isEngineerMode, setIsEngineerMode] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const simContext = useSimulation();
  const authContext = useAuth();

  // Guard against missing context during hot-reload
  if (!simContext || !authContext) {
    return <div className="h-screen w-full bg-black flex items-center justify-center font-mono text-fintech-accent">INITIALIZING_V1.0.0...</div>;
  }

  const { 
    runTransaction, speedMultiplier, setSpeedMultiplier, theme, setTheme, 
    lang, setLang, t, isInfinityMode, setIsInfinityMode,
    showTerminal, setShowTerminal 
  } = simContext;
  const { currentUser, logout } = authContext;

  const ActiveComponent = SCREEN_MAP[activeScreen];

  return (
    <div className="flex h-screen bg-[#030305] text-gray-200 font-sans overflow-hidden select-none relative">
      <BackgroundParticles />
      
      {!currentUser ? (
        <div className="flex-1 z-50">
          <LoginScreen />
        </div>
      ) : (
        <>
          {/* Left Sidebar */}
          <aside className="w-64 glass-panel border-y-0 border-l-0 flex flex-col z-20 relative">
            <div className="p-6 flex items-center space-x-3 bg-white/[0.02] border-b border-white/5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)]">
                <Globe size={22} className="text-white animate-pulse" />
              </div>
              <div>
                <h1 className="font-black text-white text-sm tracking-tight">GLOBAL COMMAND</h1>
                <p className="text-[9px] text-indigo-400 font-mono tracking-widest uppercase">Enterprise AI Ecosystem</p>
              </div>
            </div>

            <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto custom-scrollbar">
              {NAV_CATEGORIES.map((category, idx) => (
                <div key={idx} className="space-y-2">
                   <h3 className="px-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">{category.title}</h3>
                   <div className="space-y-1">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeScreen === item.id;
                        return (
                          <div 
                            key={item.id} 
                            onClick={() => setActiveScreen(item.id)}
                            className={`flex items-center space-x-3 px-4 py-2.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer relative group
                              ${isActive 
                                ? 'bg-indigo-500/10 text-white border border-indigo-500/20 shadow-lg shadow-indigo-500/5' 
                                : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03] border border-transparent'}`}
                          >
                             <Icon size={16} className={`transition-colors ${isActive ? 'text-indigo-400' : 'group-hover:text-gray-300'}`} />
                             <span>{item.label}</span>
                             {isActive && (
                               <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(79,70,229,0.8)]"></div>
                             )}
                          </div>
                        );
                      })}
                   </div>
                </div>
              ))}
            </nav>

            <div className="p-4 border-t border-fintech-border mt-auto space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-medium text-gray-400">POS Terminal</span>
                <button onClick={() => setShowTerminal(true)}
                  className="p-1.5 bg-white/5 border border-white/10 rounded-md text-gray-400 hover:text-white hover:border-white/20 transition-all">
                  <Smartphone size={14} />
                </button>
              </div>
              
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-medium text-gray-400">Traffic Generator</span>
                <button onClick={() => setIsInfinityMode(!isInfinityMode)}
                  className={`w-9 h-5 rounded-full relative transition-colors ${isInfinityMode ? 'bg-purple-600' : 'bg-gray-700'}`}>
                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${isInfinityMode ? 'left-5' : 'left-1'}`}></div>
                </button>
              </div>

              <div 
                onClick={() => setShowDiagnostics(true)}
                className="bg-black/30 rounded-lg p-3 border border-white/5 hover:bg-white/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-fintech-green animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                  <span className="group-hover:text-white transition-colors">System Status</span>
                </div>
                <div className="font-mono text-[10px] text-fintech-green uppercase">All Systems Stable</div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col h-full overflow-hidden relative">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-fintech-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Top Header */}
            <header className="h-16 glass-panel border-x-0 border-t-0 flex items-center justify-between px-6 z-10 sticky top-0 bg-black/20 backdrop-blur-xl">
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" size={16} />
                  <input type="text" placeholder="Natural Language Query: 'Show me Q3 revenue variance against Primavera schedules...'"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-12 text-xs text-gray-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono placeholder:font-sans placeholder:text-gray-500 shadow-inner shadow-black/50" />
                  <button onClick={() => alert("Voice Intelligence Module Listening...")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors">
                     <Mic size={14} className="animate-pulse" />
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 bg-black/30 border border-white/10 rounded-lg p-1.5">
                  <button onClick={() => setTheme('mada')} className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${theme === 'mada' ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'text-gray-500 hover:text-gray-300'}`}>Global AI</button>
                  <button onClick={() => setTheme('visa')} className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${theme === 'visa' ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-gray-500 hover:text-gray-300'}`}>Read-Only</button>
                  <button onClick={() => setTheme('mastercard')} className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${theme === 'mastercard' ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'text-gray-500 hover:text-gray-300'}`}>Simulate</button>
                </div>

                <div className="flex items-center space-x-3 border-r border-white/10 pr-6">
                  <Activity size={14} className="text-gray-400" />
                  <div className="text-[10px] font-mono text-emerald-400">SYNC: 14ms</div>
                </div>

                <button onClick={() => setActiveScreen('dashboard')} className="px-5 py-2 bg-white text-black hover:bg-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  Execute Query
                </button>

                <div className="border-l border-white/10 pl-6 flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-white">{currentUser.username}</div>
                    <div className="text-[9px] text-cyan-400 font-mono uppercase">Executive Board</div>
                  </div>
                  <button onClick={() => logout()} className="p-2.5 bg-black/40 border border-white/10 rounded-xl text-gray-400 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-500/10 transition-all">
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </header>

            {/* Screen Content */}
            <div className="flex-1 overflow-hidden relative">
              {ActiveComponent && <ActiveComponent setActiveScreen={setActiveScreen} />}
            </div>
          </main>
        </>
      )}

      {/* Diagnostics Modal */}
      {showDiagnostics && <SystemDiagnosticsModal onClose={() => setShowDiagnostics(false)} />}
      {/* Virtual Terminal */}
      {showTerminal && <VirtualTerminal onClose={() => setShowTerminal(false)} />}
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-[#050508] flex flex-col items-center justify-center p-10 font-mono">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Kernel Panic: UI_THREAD_CRASH</h1>
          <div className="bg-black/60 border border-red-500/30 p-6 rounded-xl max-w-2xl w-full">
            <p className="text-red-400 text-xs mb-4">An unhandled exception has occurred in the rendering engine:</p>
            <pre className="text-[10px] text-gray-500 overflow-auto max-h-40 whitespace-pre-wrap">
              {this.state.error?.stack || this.state.error?.message || 'Unknown Runtime Error'}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-2 bg-fintech-accent text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:scale-105 transition-all"
          >
            Reboot System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SimulationProvider>
          <AppContent />
        </SimulationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
