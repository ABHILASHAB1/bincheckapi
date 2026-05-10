import React, { useMemo } from 'react';
import { useSimulation } from '../context/SimulationContext';

export default function BackgroundParticles() {
  const { systemHealth } = useSimulation();
  
  // Create 50 particles
  const particles = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * -20,
      opacity: Math.random() * 0.3 + 0.1
    }));
  }, []);

  // Intensity increases with avgResponse or system alerts
  const intensity = Math.min(systemHealth.avgResponse / 200, 2);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-fintech-accent animate-float"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            '--float-duration': `${p.duration / intensity}s`,
            '--float-delay': `${p.delay}s`,
            filter: 'blur(1px)'
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-50px) translateX(20px); }
          66% { transform: translateY(20px) translateX(-30px); }
          100% { transform: translateY(0) translateX(0); }
        }
        .animate-float {
          animation: float var(--float-duration) infinite ease-in-out;
          animation-delay: var(--float-delay);
        }
      `}} />
    </div>
  );
}
