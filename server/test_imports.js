import express from 'express';
import cors from 'cors';
import { setupDatabase } from './db.js';
import { BinService } from './binService.js';
import { startTcpSwitch } from './tcpSwitch.js';
import { IsoPacker } from './isoPacker.js';
import { CryptoLab } from './cryptoLab.js';
import { XSDEngine } from './xsdEngine.js';
import { supabase } from './supabaseClient.js';
import net from 'net';
import tls from 'tls';
import { RemittanceService } from './remittanceService.js';
import { importBinsFromCsv } from './importCsvBins.js';

console.log('✅ ALL IMPORTS SUCCESSFUL');
process.exit(0);
