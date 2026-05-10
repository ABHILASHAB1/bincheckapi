import { TCPClient } from './src/tcp/client.js';
import { ReversalEngine } from './src/transactions/reversal.js';
import { Builder } from './src/iso/builder.js';

/**
 * FAULT INJECTION: Network Drop & Reversal
 * 1. Connect & Sign-On
 * 2. Send 0200 Financial Request
 * 3. KILL SOCKET (Simulate Network Outage)
 * 4. Queue 0420 Reversal Advice
 * 5. Re-connect & Flush
 */
async function runFaultTest() {
    const client = new TCPClient('127.0.0.1', 8583);
    client.connect();

    // Wait for Sign-On to finish
    setTimeout(async () => {
        console.log('💳 [FAULT TEST] Initiating Financial 0200...');
        
        const originalRequest = {
            mti: '0200',
            elements: {
                '002': '9682010000000001',
                '004': '000000005000',
                '011': '999999' // Target for reversal
            }
        };

        // Send 0200 and IMMEDIATELY DESTROY SOCKET
        client.socket.write(Builder.pack(originalRequest));
        console.log('☢️ [FAULT TEST] SIMULATING CATASTROPHIC NETWORK DROP...');
        client.socket.destroy(); 

        // Queue the reversal advice manually since we killed the link
        const advice = ReversalEngine.createAdvice(originalRequest);
        client.reversalQueue.push(advice);
        console.log('🔄 [FAULT TEST] 0420 Reversal Advice Queued in Client Memory.');

    }, 3000); // 3 seconds after connect
}

runFaultTest();
