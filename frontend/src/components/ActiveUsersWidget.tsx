"use client";

import { useState, useEffect } from 'react';

export default function ActiveUsersWidget() {
  const [activeUsers, setActiveUsers] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchActiveUsers = async () => {
      try {
        const res = await fetch('https://remitwise.fit/api/analytics/active', {
            cache: 'no-store'
        });
        const data = await res.json();
        if (isMounted && data.active_users) {
          setActiveUsers(data.active_users);
        }
      } catch (err) {
        console.error('Failed to fetch active users:', err);
      }
    };

    // Fetch immediately
    fetchActiveUsers();

    // Then poll every 15 seconds
    const interval = setInterval(fetchActiveUsers, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (activeUsers === null) return null;

  return (
    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-slate-200/20 px-4 py-2 rounded-full shadow-sm text-sm font-medium text-slate-700">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
      </span>
      <span className="tabular-nums font-bold">{activeUsers.toLocaleString()}</span> active users online now
    </div>
  );
}
