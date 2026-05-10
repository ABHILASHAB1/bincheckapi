async function diagnose() {
  console.log('--- STARTING BOOT DIAGNOSTIC ---');
  
  const modules = [
    './db.js',
    './binService.js',
    './tcpSwitch.js',
    './isoPacker.js',
    './cryptoLab.js',
    './xsdEngine.js',
    './supabaseClient.js',
    './remittanceService.js',
    './importCsvBins.js'
  ];

  for (const mod of modules) {
    try {
      console.log(`Testing import: ${mod}...`);
      await import(mod);
      console.log(`✅ ${mod} OK`);
    } catch (err) {
      console.error(`❌ FAILED to import ${mod}:`);
      console.error(err);
      // We don't exit, we want to see if others fail too
    }
  }
  
  console.log('--- DIAGNOSTIC COMPLETE ---');
}

diagnose();
