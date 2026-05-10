import React, { useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { 
  Globe as GlobeIcon, MapPin, Activity, Zap, 
  ShieldCheck, ArrowUpRight, TrendingUp, Info,
  Maximize2, Crosshair, Search, Filter, Layers
} from 'lucide-react';

const ARC_DATA = [
  { startLat: 24.7136, startLng: 46.6753, endLat: 40.7128, endLng: -74.0060, color: '#3b82f6', label: 'Treasury Flow: Riyadh -> NYC' },
  { startLat: 24.7136, startLng: 46.6753, endLat: 51.5074, endLng: -0.1278, color: '#10b981', label: 'Settlement: Riyadh -> London' },
  { startLat: 21.4858, startLng: 39.1925, endLat: 1.3521, endLng: 103.8198, color: '#f59e0b', label: 'Logistics: Jeddah -> Singapore' },
  { startLat: 26.3927, startLng: 49.9777, endLat: 35.6762, endLng: 139.6503, color: '#6366f1', label: 'Investment: Khobar -> Tokyo' },
];

const POINT_DATA = [
  { lat: 24.7136, lng: 46.6753, size: 0.1, color: '#3b82f6', name: 'Riyadh HQ' },
  { lat: 21.4858, lng: 39.1925, size: 0.08, color: '#10b981', name: 'Jeddah Port' },
  { lat: 26.3927, lng: 49.9777, size: 0.08, color: '#f59e0b', name: 'Khobar Hub' },
  { lat: 28.5333, lng: 35.0667, size: 0.12, color: '#ef4444', name: 'NEOM Site' },
];

export default function LiquidityGlobeScreen() {
  const { opsPulse } = useSimulation();
  const globeRef = useRef();
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hoverArc, setHoverArc] = useState(null);

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      globeRef.current.pointOfView({ lat: 24, lng: 46, altitude: 2.5 });
    }
  }, []);

  const stats = useMemo(() => [
    { label: 'Global Active Projects', value: '42', change: '+3', icon: MapPin },
    { label: 'Cross-Border Velocity', value: `${opsPulse?.data?.tps || 800} TX/s`, change: '+12%', icon: Activity },
    { label: 'Security Nodes Active', value: `${opsPulse?.data?.activeNodes || 124}`, change: 'Stable', icon: ShieldCheck },
  ], [opsPulse]);

  return (
    <div className="h-full w-full flex flex-col p-6 space-y-6 overflow-hidden bg-[#030305] relative">
      
      {/* Background Cinematic Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05)_0%,transparent_70%)] pointer-events-none"></div>

      {/* Header Overlay */}
      <div className="absolute top-10 left-10 z-10">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 mb-3">
          <GlobeIcon size={12} />
          <span>NASA Mission Control Environment</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter">
          Global Intelligence Map
        </h1>
        <p className="text-sm text-gray-500 mt-1 max-w-md font-medium">
          Real-time visualization of capital flows, infrastructure projects, and regional risk indices across the global ecosystem.
        </p>

        <div className="mt-8 flex items-center space-x-4">
           <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl">
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Global Heartbeat</div>
              <div className="text-lg text-white font-mono flex items-center gap-2 mt-1">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 {opsPulse?.data?.latency || 0.42}ms Latency
              </div>
           </div>
           <button className="p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all">
              <Maximize2 size={20} />
           </button>
        </div>
      </div>

      {/* Right: Telemetry Wall */}
      <div className="absolute top-10 right-10 z-10 w-80 space-y-4">
         {stats.map((stat, i) => (
           <div key={i} className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-2xl group hover:border-indigo-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                    <stat.icon size={20} />
                 </div>
                 <div className={`text-[10px] font-black px-1.5 py-0.5 rounded ${stat.change.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    {stat.change}
                 </div>
              </div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
           </div>
         ))}

         {/* Selection Detail Card */}
         <div className={`glass-panel p-6 rounded-[2.5rem] border border-indigo-500/30 bg-indigo-500/5 backdrop-blur-2xl transition-all duration-500 transform
           ${selectedPoint ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
            <div className="flex items-center space-x-3 mb-6">
               <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <Crosshair size={20} />
               </div>
               <div>
                  <h4 className="text-sm font-black text-white uppercase">{selectedPoint?.name}</h4>
                  <div className="text-[9px] text-indigo-400 font-mono tracking-widest">NODE_ACTIVE_001</div>
               </div>
            </div>
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Operational Health</span>
                  <span className="text-emerald-400 text-xs font-black">98.4%</span>
               </div>
               <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '98%' }}></div>
               </div>
               <p className="text-[10px] text-gray-400 leading-relaxed mt-4 italic">
                  "This hub is currently processing <span className="text-white font-bold">12% more traffic</span> than the regional baseline."
               </p>
               <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mt-4">
                  Drill Down Into Node
               </button>
            </div>
         </div>
      </div>

      {/* Bottom: Flow Monitor */}
      <div className="absolute bottom-10 left-10 z-10 flex items-center space-x-6">
         <div className="glass-panel px-6 py-4 rounded-2xl border border-white/5 bg-black/60 backdrop-blur-xl flex items-center space-x-8">
            <div className="flex items-center space-x-3">
               <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Treasury</span>
            </div>
            <div className="flex items-center space-x-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Settlement</span>
            </div>
            <div className="flex items-center space-x-3">
               <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logistics</span>
            </div>
         </div>
         <div className="glass-panel px-6 py-4 rounded-2xl border border-white/5 bg-black/60 backdrop-blur-xl text-[10px] font-mono text-indigo-400 flex items-center space-x-3">
            <Search size={14} />
            <span>GEO_QUERY: SELECT * FROM GLOBAL_FLOWS WHERE RISK &gt; 0.4</span>
         </div>
      </div>

      {/* Globe Canvas Container */}
      <div className="flex-1 rounded-[3rem] overflow-hidden border border-white/5 relative group cursor-grab active:cursor-grabbing">
         <Globe
           ref={globeRef}
           backgroundColor="rgba(0,0,0,0)"
           globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
           bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
           backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
           
           arcsData={ARC_DATA}
           arcColor="color"
           arcDashLength={0.4}
           arcDashGap={4}
           arcDashAnimateTime={2000}
           arcStroke={0.5}
           
           pointsData={POINT_DATA}
           pointLat="lat"
           pointLng="lng"
           pointColor="color"
           pointRadius="size"
           pointAltitude={0.01}
           pointLabel="name"
           onPointClick={(point) => setSelectedPoint(point)}
           
           atmosphereColor="#3b82f6"
           atmosphereAltitude={0.15}
         />
      </div>

    </div>
  );
}
