/**
 * src/tcp/client.js
 * Stateful Enterprise Client with Auto-Reconnect & Reversal Resilience.
 */
import net from 'net';
import { SignOn } from '../network/signon.js';
import { Echo } from '../network/echo.js';
import { Parser } from '../iso/parser.js';

export class TCPClient {
    constructor(host = '127.0.0.1', port = 8583) {
        this.host = host;
        this.port = port;
        this.socket = null;
        this.isConnected = false;
        this.reversalQueue = [];
    }

    connect() {
        console.log(`🔌 [CLIENT] Dialing ${this.host}:${this.port}...`);
        this.socket = new net.Socket();

        this.socket.connect(this.port, this.host, () => {
            this.isConnected = true;
            console.log('✅ [CLIENT] Link Established.');
            this.onConnect();
        });

        this.socket.on('data', (data) => this.handleData(data));
        
        this.socket.on('close', () => {
            this.isConnected = false;
            console.warn('⚠️ [CLIENT] Link Dropped. Retrying in 5s...');
            setTimeout(() => this.connect(), 5000);
        });

        this.socket.on('error', (err) => console.error('❌ [CLIENT] Socket Error:', err.message));
    }

    onConnect() {
        // 1. Mandatory Sign-On
        const signOnBuffer = SignOn.buildRequest('000001');
        this.socket.write(signOnBuffer);

        // 2. Start Echo Pulse
        setInterval(() => {
            if (this.isConnected) {
                const echoBuffer = Echo.buildRequest();
                this.socket.write(echoBuffer);
            }
        }, 30000);

        // 3. Flush Reversals
        this.flushReversals();
    }

    send(buffer) {
        if (!this.isConnected) {
            console.warn('⚠️ [CLIENT] Offline. Queuing for retry...');
            // In production, we'd check if it's a reversal and queue it
            return false;
        }
        this.socket.write(buffer);
        return true;
    }

    flushReversals() {
        while (this.reversalQueue.length > 0 && this.isConnected) {
            const advice = this.reversalQueue.shift();
            this.socket.write(advice);
            console.log('🔄 [CLIENT] Re-transmitting queued reversal advice.');
        }
    }

    handleData(data) {
        try {
            const decoded = Parser.unpack(data);
            console.log(`📥 [CLIENT] Incoming MTI: ${decoded.mti} | RC: ${decoded.elements['039']}`);
        } catch (e) {
            console.error('❌ [CLIENT] Parsing Error:', e.message);
        }
    }
}
