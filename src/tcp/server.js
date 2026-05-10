import net from 'net';
import { Builder } from '../iso/builder.js';
import { RealtimeVault } from '../realtime/supabase.js';
import { Parser } from '../iso/parser.js';
import { MadaRouter } from '../routes/mada.js';
import { VisaRouter } from '../routes/visa.js';

export class TCPServer {
    constructor(port = 8583, onMessage = null) {
        this.port = port;
        this.onMessage = onMessage;
        this.server = null;
    }

    start() {
        this.server = net.createServer((socket) => {
            console.log(`📡 [SWITCH] Host Connected: ${socket.remoteAddress}`);
            
            socket.on('data', async (data) => {
                await this.handleMessage(socket, data);
            });

            socket.on('error', (err) => console.error('❌ [SWITCH] Socket Error:', err.message));
        });

        this.server.listen(this.port, () => {
            console.log(`🚀 [SWITCH] Modular Switch Online on Port ${this.port}`);
        });
    }

    async handleMessage(socket, data) {
        try {
            const parsed = Parser.unpack(data);
            const pan = parsed.elements['002'] || '';
            
            console.log(`📥 [SWITCH] Incoming MTI: ${parsed.mti} | PAN: ${pan.slice(0, 6)}****`);

            // 1. Audit to Cloud
            await RealtimeVault.logNetworkEvent(parsed.mti, 'IN', data.toString('hex'));

            // 2. REMOTE ISSUER PROXY (New Forensic Bridge)
            const ISSUER_HOST = '127.0.0.1';
            const ISSUER_PORT = 8584;

            console.log(`🛰️  [PROXY] Attempting Remote Auth via Issuer at ${ISSUER_HOST}:${ISSUER_PORT}...`);
            
            const forwardToRemote = () => new Promise((resolve, reject) => {
                const client = new net.Socket();
                let responded = false;

                client.connect(ISSUER_PORT, ISSUER_HOST, () => {
                    client.write(data);
                });

                client.on('data', (respData) => {
                    responded = true;
                    client.destroy();
                    resolve(respData);
                });

                client.on('error', (err) => {
                    if (!responded) {
                        client.destroy();
                        reject(err);
                    }
                });

                // 2-second timeout for Issuer response
                setTimeout(() => {
                    if (!responded) {
                        client.destroy();
                        reject(new Error('Issuer Timeout'));
                    }
                }, 2000);
            });

            try {
                const responseBuffer = await forwardToRemote();
                console.log(`✅ [PROXY] Issuer Response Received. Piping back to Simulator.`);
                socket.write(responseBuffer);
                
                // Unpack for dashboard logging
                const respParsed = Parser.unpack(responseBuffer);
                this.logToDashboard(parsed, respParsed, responseBuffer);
                return;
            } catch (proxyErr) {
                console.warn(`⚠️ [PROXY] Remote Issuer Unavailable (${proxyErr.message}). Falling back to local simulation.`);
            }

            // 3. Network Management (Sign-On) Flow
            if (parsed.mti === '0800') {
              const nmCode = parsed.elements['070'];
              console.log(`📡 [SWITCH] Network Management Request: ${nmCode === '001' ? 'Logon' : nmCode}`);
              
              const response = {
                  mti: '0810',
                  elements: { ...parsed.elements, '039': '00' }
              };
              const responseBuffer = Builder.pack(response);
              socket.write(responseBuffer);
              this.logToDashboard(parsed, response, responseBuffer);
              return;
            }

            // 4. Fallback: Local Simulation Logic (Legacy)
            let respCode = '00';
            const amt = parseFloat(parsed.elements['004'] || '0') / 100;
            
            if (MadaRouter.isMada(pan)) {
                const validation = MadaRouter.validate(parsed);
                if (!validation.valid) respCode = validation.code;
            } else if (VisaRouter.isVisa(pan)) {
                const validation = VisaRouter.validate(parsed);
                if (!validation.valid) respCode = validation.code;
            }

            if (parsed.mti === '0200' || parsed.mti === '0100') {
                if (amt === 51.00) respCode = '51';
                if (amt === 0.05)  respCode = '05'; 
            }

            const response = {
                mti: (parseInt(parsed.mti, 10) + 10).toString().padStart(4, '0'),
                elements: { ...parsed.elements, '039': respCode }
            };

            const responseBuffer = Builder.pack(response);
            socket.write(responseBuffer);
            this.logToDashboard(parsed, response, responseBuffer);

        } catch (err) {
            console.error('❌ [SWITCH] Processing Error:', err.message);
        }
    }

    logToDashboard(request, response, rawBuffer) {
        if (!this.onMessage) return;
        
        const pan = request.elements['002'] || '';
        const respCode = response.elements ? response.elements['039'] : (response['039'] || '00');

        const txRecord = {
            type: 'ISO8583',
            mti: request.mti,
            pan: pan.slice(-4),
            pan_masked: pan.slice(0, 6) + '******' + pan.slice(-4),
            amount: parseFloat(request.elements['004'] || '0') / 100,
            stan: request.elements['011'] || '',
            rrn: request.elements['037'] || '',
            resp_code: respCode,
            status: respCode === '00' ? 'APPROVED' : 'DECLINED',
            payload_json: { request: request.elements, response: response.elements || response },
            raw_payload: rawBuffer.toString('hex'),
            created_at: new Date().toISOString()
        };
        this.onMessage(txRecord);
    }
}
