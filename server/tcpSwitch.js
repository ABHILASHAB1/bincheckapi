import { TCPServer } from '../src/tcp/server.js';

/**
 * startTcpSwitch
 * Legacy bridge to the new Enterprise Modular TCPServer.
 */
export function startTcpSwitch(broadcast) {
  // Use the broadcast function as the onMessage hook
  const switchEngine = new TCPServer(8583, (txRecord) => {
      if (broadcast) {
          broadcast('iso_log', txRecord);
      }
  });
  
  switchEngine.start();
  console.log('✅ [BRIDGE] Legacy Switch redirected to Modular Enterprise Engine with Dashboard Hook.');
}
