import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

const INITIAL_USERS = {
  admin: {
    username: 'admin',
    password: import.meta.env.VITE_ADMIN_PASSWORD || 'adminpassword', // Avoid hardcoding in source control
    role: 'admin',
    isDisabled: false,
    startTime: '', // ISO string, empty means no restriction
    endTime: '',
  },
  tester: {
    username: 'tester',
    password: 'password',
    role: 'user',
    isDisabled: false,
    startTime: '',
    endTime: '',
  }
};

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('iso_simulator_users');
      const parsed = saved ? JSON.parse(saved) : INITIAL_USERS;
      // Force ensure admin exists and is correct
      return { ...parsed, admin: INITIAL_USERS.admin };
    } catch (e) {
      console.error('Failed to parse users, resetting to defaults');
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('iso_simulator_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [authError, setAuthError] = useState('');
  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('iso_simulator_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [clientNetworkInfo, setClientNetworkInfo] = useState({ ip: 'Unknown', country: 'Unknown' });

  // Network info is now simulated to avoid CORS/privacy blocks
  useEffect(() => {
    setClientNetworkInfo({ ip: '127.0.0.1', country: 'Local Network' });
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('iso_simulator_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('iso_simulator_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('iso_simulator_session');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('iso_simulator_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const logAudit = (action, targetUser, status, details) => {
    // Parse a simple browser name from UserAgent
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';

    const newLog = {
      timestamp: new Date().toISOString(),
      actor: currentUser ? currentUser.username : 'SYSTEM',
      action,
      targetUser,
      status,
      details,
      ip: clientNetworkInfo.ip,
      country: clientNetworkInfo.country,
      browser: browser
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100
  };

  // Check if a user's time is valid
  const checkTimeValidity = (user) => {
    if (user.isDisabled === true || user.isDisabled === 'true') {
      return { valid: false, reason: 'Account is manually disabled by administrator.' };
    }

    const now = new Date().getTime();
    
    if (user.startTime) {
      const start = new Date(user.startTime).getTime();
      if (now < start) return { valid: false, reason: `Time-Bound Restriction: Access starts at ${new Date(user.startTime).toLocaleString()}` };
    }
    
    if (user.endTime) {
      const end = new Date(user.endTime).getTime();
      if (now > end) return { valid: false, reason: `Time-Bound Restriction: Access expired on ${new Date(user.endTime).toLocaleString()}` };
    }

    return { valid: true };
  };

  // Auto-logout checker for active sessions
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      // Re-fetch user in case admin changed it
      const upToDateUser = users[currentUser.username];
      
      if (!upToDateUser) {
        logout('Account deleted');
        return;
      }

      const validity = checkTimeValidity(upToDateUser);
      if (!validity.valid) {
        logout(validity.reason);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [currentUser, users]);

  const login = (username, password) => {
    setAuthError('');
    const user = users[username];

    if (!user) {
      setAuthError('Invalid credentials');
      logAudit('LOGIN_ATTEMPT', username, 'FAILURE', 'User not found');
      return false;
    }

    if (user.password !== password) {
      setAuthError('Invalid credentials');
      logAudit('LOGIN_ATTEMPT', username, 'FAILURE', 'Invalid password');
      return false;
    }

    const validity = checkTimeValidity(user);
    if (!validity.valid) {
      setAuthError(validity.reason);
      logAudit('LOGIN_ATTEMPT', username, 'FAILURE', validity.reason);
      return false;
    }

    setCurrentUser({ username: user.username, role: user.role });
    logAudit('LOGIN', username, 'SUCCESS', 'User logged in successfully');
    return true;
  };

  const logout = (reason = 'User initiated logout') => {
    if (currentUser) {
      logAudit('LOGOUT', currentUser.username, 'SUCCESS', reason);
    }
    setCurrentUser(null);
  };

  // Admin Functions
  const updateUser = (username, updates) => {
    if (currentUser?.role !== 'admin') return;
    setUsers(prev => ({
      ...prev,
      [username]: { ...prev[username], ...updates }
    }));
    logAudit('UPDATE_USER', username, 'SUCCESS', `Updated fields: ${Object.keys(updates).join(', ')}`);
  };

  const createUser = (username, password, role, startTime, endTime) => {
    if (currentUser?.role !== 'admin') return;
    if (users[username]) return false; // Already exists

    setUsers(prev => ({
      ...prev,
      [username]: { username, password, role, isDisabled: false, startTime, endTime }
    }));
    logAudit('CREATE_USER', username, 'SUCCESS', `Created ${role} user`);
    return true;
  };

  const deleteUser = (username) => {
    if (currentUser?.role !== 'admin') return;
    if (username === 'admin') return; // Cannot delete core admin

    const newUsers = { ...users };
    delete newUsers[username];
    setUsers(newUsers);
    logAudit('DELETE_USER', username, 'SUCCESS', 'User removed from system');
  };

  const safeUsers = React.useMemo(() => {
    const safe = {};
    for (const key in users) {
      const { password, ...rest } = users[key];
      // Expose passwords only to the admin module/role
      if (currentUser?.role === 'admin') {
        safe[key] = { ...rest, password };
      } else {
        safe[key] = rest;
      }
    }
    return safe;
  }, [users, currentUser]);

  return (
    <AuthContext.Provider value={{
      users: safeUsers,
      currentUser,
      authError,
      auditLogs,
      login,
      logout,
      updateUser,
      createUser,
      deleteUser,
      checkTimeValidity
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
