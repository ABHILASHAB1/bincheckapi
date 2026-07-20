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

    let lastPingTime = Date.now();
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
        const now = Date.now();
        const delta_ms = now - lastPingTime;
        lastPingTime = now; // Reset the clock for the next ping

        // Don't send empty pings
        if (delta_ms <= 0 && !isFinal) return;

        const payload = {
            session_id: sessionId,
            page_url: pageUrl,
            theme_mode: getThemeMode(),
            delta_ms: delta_ms,
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

/**
 * Anti-Scraping and Anti-Inspect Protections
 */
(function() {
    let hasAlerted = false;
    
    function triggerSecurityAlert(action) {
        if (hasAlerted) return;
        hasAlerted = true;
        
        fetch('/api/security/alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action, path: window.location.pathname })
        }).catch(() => {});
    }

    // 1. Disable Right-Click (Context Menu)
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        triggerSecurityAlert('Right-Click / Context Menu');
    });

    // 2. Disable Keyboard Shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            triggerSecurityAlert('F12 DevTools Shortcut');
            return false;
        }
        // Ctrl+Shift+I (Inspect)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
            e.preventDefault();
            triggerSecurityAlert('Ctrl+Shift+I Inspect Shortcut');
            return false;
        }
        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
            e.preventDefault();
            triggerSecurityAlert('Ctrl+Shift+J Console Shortcut');
            return false;
        }
        // Ctrl+Shift+C (Inspect Element)
        if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
            e.preventDefault();
            triggerSecurityAlert('Ctrl+Shift+C Inspect Shortcut');
            return false;
        }
        // Ctrl+U (View Source)
        if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
            e.preventDefault();
            triggerSecurityAlert('Ctrl+U View Source Shortcut');
            return false;
        }
    });

    // 3. Disable Text Selection & Copying
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
    });
    document.addEventListener('copy', function(e) {
        e.preventDefault();
        triggerSecurityAlert('Text Copy Attempt');
    });

    // Add CSS to disable selection visually
    const style = document.createElement('style');
    style.innerHTML = `
        body {
            -webkit-user-select: none; /* Safari */
            -ms-user-select: none; /* IE 10 and IE 11 */
            user-select: none; /* Standard syntax */
        }
    `;
    document.head.appendChild(style);

    // 4. Debugger Trap (Anti-DevTools)
    // Constantly triggers debugger if console is open
    setInterval(function() {
        const before = new Date().getTime();
        debugger;
        const after = new Date().getTime();
        if (after - before > 100) {
            // DevTools is likely open and paused on debugger
            triggerSecurityAlert('Debugger Trap (DevTools Forced Open)');
            document.body.innerHTML = "Inspector detected. Access denied.";
        }
    }, 1000);
})();
