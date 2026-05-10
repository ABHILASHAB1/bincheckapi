import { execSync } from 'child_process';

const ports = [5173, 3001, 3002, 8583];

console.log('🛡️ [PORT-GUARD] Sanitizing network environment...');

ports.forEach(port => {
    try {
        // Find PID on Windows
        const stdout = execSync(`netstat -ano | findstr :${port}`).toString();
        const lines = stdout.split('\n');
        
        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(pid) && pid !== '0') {
                console.log(`  ➜ Terminating ghost process ${pid} on port ${port}...`);
                execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            }
        });
    } catch (e) {}
});

console.log('✅ [PORT-GUARD] Environment sanitized. Proceeding to launch...');
