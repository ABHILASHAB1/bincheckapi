import net from 'net';
import { IsoPacker } from './server/isoPacker.js';

/**
 * mada/SAMA Network Management Request (0800)
 * This script performs a Echo Test / Logon handshake with the Simulator.
 */
async function runEchoTest() {
    const PORT = 8583;
    const HOST = '127.0.0.1';

    console.log(`📡 [CLIENT] Initiating connection to ${HOST}:${PORT}...`);

    const client = new net.Socket();

    client.connect(PORT, HOST, () => {
        console.log('✅ [CLIENT] Connected to ISO 8583 Switch.');

        // Build 0800 Network Management Request
        const echoRequest = {
            mti: '0800',
            elements: {
                '007': new Date().toISOString().replace(/[-:T]/g, '').slice(4, 14), // Transmission Date & Time
                '011': Math.floor(100000 + Math.random() * 900000).toString(),      // STAN
                '070': '301'                                                        // NMIC: Echo Test
            }
        };

        const buffer = IsoPacker.pack(echoRequest);
        console.log('📤 [CLIENT] Sending 0800 Echo Request...');
        console.log('📦 Raw Hex:', buffer.toString('hex').toUpperCase());
        
        client.write(buffer);
    });

    client.on('data', (data) => {
        console.log('📥 [CLIENT] Received Response from Switch.');
        try {
            const decoded = IsoPacker.unpack(data);
            console.log('📄 Decoded Response (MTI):', decoded.mti);
            console.log('✅ Status (DE 39):', decoded.elements['039'] === '00' ? 'SUCCESS' : 'FAILED');
            console.log('🔍 Elements:', decoded.elements);
        } catch (e) {
            console.error('❌ [CLIENT] Failed to unpack response:', e.message);
            console.log('Raw Bytes:', data.toString('hex').toUpperCase());
        }
        client.destroy();
    });

    client.on('close', () => console.log('🔌 [CLIENT] Connection closed.'));
    client.on('error', (err) => console.error('🚫 [CLIENT] Connection Error:', err.message));
}

runEchoTest();
