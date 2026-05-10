import { setupDatabase } from './db.js';
import { setupRemittanceDB } from './remittanceDB.js';
import fs from 'fs';

async function heartbeat() {
  console.log('💓 SIMULATOR HEARTBEAT CHECK');
  console.log('----------------------------');

  try {
    console.log('🔍 Checking Node version...');
    console.log(`   Version: ${process.version}`);
    console.log(`   Platform: ${process.platform}`);

    console.log('\n🔍 Checking Database Connections...');
    const db1 = await setupDatabase();
    console.log('   ✅ Bins DB: OK');
    
    const db2 = await setupRemittanceDB();
    console.log('   ✅ Remittance DB: OK');

    console.log('\n🔍 Checking Port Availability...');
    // We'll test 3001
    import('net').then(net => {
      const server = net.createServer();
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log('   ❌ Port 3001 is already in use!');
        } else {
          console.log(`   ❌ Port 3001 Error: ${err.message}`);
        }
        process.exit(1);
      });
      server.once('listening', () => {
        console.log('   ✅ Port 3001 is FREE');
        server.close();
        
        console.log('\n🚀 ALL CORE SERVICES VALIDATED.');
        console.log('If the app still crashes, the issue is likely in the Express middleware or frontend bundling.');
        process.exit(0);
      });
      server.listen(3001);
    });

  } catch (err) {
    console.error('\n🛑 HEARTBEAT FAILED:');
    console.error(err);
    process.exit(1);
  }
}

heartbeat();
