/**
 * RemitWise Analytics Tracking Engine
 * Injected globally into all pages.
 */

(function() {
    // 1. Session ID Management
    let sessionId = sessionStorage.getItem('rw_session_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID ? crypto.randomUUID() : 'rw-' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('rw_session_id', sessionId);
    }

    // 2. State
    const startTime = Date.now();
    const pageUrl = window.location.pathname;
    
    // 3. Helper to determine current theme
    function getThemeMode() {
        if (document.body && document.body.classList.contains('light-theme')) {
            return 'light';
        }
        if (document.documentElement && document.documentElement.classList.contains('light-theme')) {
            return 'light';
        }
        return 'dark'; // Default
    }

    // 4. Send telemetry data to backend
    function sendTelemetry(isFinal = false) {
        const timeSpent = Date.now() - startTime;
        const payload = {
            session_id: sessionId,
            page_url: pageUrl,
            theme_mode: getThemeMode(),
            time_spent_ms: timeSpent,
            user_agent: navigator.userAgent
        };

        if (isFinal && navigator.sendBeacon) {
            // Using sendBeacon for reliable delivery when tab is closing
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon('/api/analytics/track', blob);
        } else {
            // Using fetch for heartbeat
            fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: isFinal // fallback if beacon fails
            }).catch(() => {}); // Ignore errors silently in background
        }
    }

    // 5. Heartbeat every 15 seconds
    setInterval(() => {
        sendTelemetry(false);
    }, 15000); // 15 seconds as approved by user

    // 6. Final send when user leaves the page or hides tab
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            sendTelemetry(true);
        }
    });

    // Fallback for older browsers
    window.addEventListener('beforeunload', () => {
        sendTelemetry(true);
    });

    // 7. Initial Page Load Hit
    // Delay slightly to ensure body class is parsed
    setTimeout(() => {
        sendTelemetry(false);
    }, 1000);

})();
