import { setupDatabase } from './db.js';
import { supabase } from './supabaseClient.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const saudiBins = [
  { bin: '968211', scheme: 'Mada', type: 'UNKNOWN', category: 'Local', issuer: 'Bank Al-Jazira' },
  { bin: '42689700', scheme: 'Mada', type: 'UNKNOWN', category: 'Local', issuer: 'INMA Bank' },
  { bin: '968209', scheme: 'Mada', type: 'DEBIT', category: 'Local', issuer: 'Riyadh Bank' },
  { bin: '968208', scheme: 'Mada', type: 'DEBIT', category: 'Local', issuer: 'Al Bank Al Saudi Al Fransi' },
  { bin: '968207', scheme: 'Mada', type: 'DEBIT', category: 'Local', issuer: 'Saudi Investment Bank' },
  { bin: '968206', scheme: 'Mada', type: 'DEBIT', category: 'Local', issuer: 'INMA Bank' },
  { bin: '968205', scheme: 'Mada', type: 'DEBIT', category: 'Local', issuer: 'Al Rajhi Banking and Inv. Corp.' },
  { bin: '968204', scheme: 'Mada', type: 'DEBIT', category: 'Local', issuer: 'Saudi British Bank' },
  { bin: '968203', scheme: 'Mada', type: 'DEBIT', category: 'Local', issuer: 'Arab National Bank' },
  { bin: '968202', scheme: 'Mada', type: 'DEBIT', category: 'Local', issuer: 'National Commercial Bank' },
  { bin: '968201', scheme: 'Mada', type: 'DEBIT', category: 'Local', issuer: 'Al Bilad Bank' },
  { bin: '968200', scheme: 'PRIVATE LABEL', type: 'DEBIT', category: 'PROPRIETARY ATM', issuer: 'Saudi Domestic - Generic' },
  { bin: '900682', scheme: 'PRIVATE LABEL', type: 'DEBIT', category: 'PROPRIETARY ATM', issuer: 'Saudi Domestic - Generic' },
  { bin: '636120', scheme: 'Mada', type: 'DEBIT', category: 'Local', issuer: 'Al Bilad Bank' },
  { bin: '605141', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'Saudi British Bank' },
  { bin: '604906', scheme: 'Mada', type: 'DEBIT', category: 'Visa', issuer: 'National Bank of Bahrain' },
  { bin: '589206', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'Saudi Investment Bank' },
  { bin: '588851', scheme: 'MAESTRO', type: 'DEBIT', category: 'UNKNOWN', issuer: 'Saudi Payments Network' },
  { bin: '588850', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'National Commercial Bank' },
  { bin: '588848', scheme: 'Mada', type: 'DEBIT', category: 'Visa', issuer: 'Arab National Bank' },
  { bin: '588847', scheme: 'MAESTRO', type: 'DEBIT', category: 'STANDARD', issuer: 'Saudi Payments Network' },
  { bin: '588846', scheme: 'MAESTRO', type: 'DEBIT', category: 'UNKNOWN', issuer: 'Saudi Payments Network' },
  { bin: '588845', scheme: 'Mada', type: 'DEBIT', category: 'Visa', issuer: 'Al Bank Al Saudi Al Fransi' },
  { bin: '588292', scheme: 'MAESTRO', type: 'DEBIT', category: 'UNKNOWN', issuer: 'Saudi Payments Network' },
  { bin: '585685', scheme: 'MAESTRO', type: 'DEBIT', category: 'STANDARD', issuer: 'MAESTRO INTERNATIONAL' },
  { bin: '579987', scheme: 'MAESTRO', type: 'DEBIT', category: 'STANDARD', issuer: 'MAESTRO INTERNATIONAL' },
  { bin: '579986', scheme: 'MAESTRO', type: 'DEBIT', category: 'STANDARD', issuer: 'MAESTRO INTERNATIONAL' },
  { bin: '579985', scheme: 'MAESTRO', type: 'DEBIT', category: 'STANDARD', issuer: 'MAESTRO INTERNATIONAL' },
  { bin: '579984', scheme: 'MAESTRO', type: 'DEBIT', category: 'STANDARD', issuer: 'MAESTRO INTERNATIONAL' },
  { bin: '579983', scheme: 'MAESTRO', type: 'DEBIT', category: 'STANDARD', issuer: 'MAESTRO INTERNATIONAL' },
  { bin: '579982', scheme: 'MAESTRO', type: 'DEBIT', category: 'STANDARD', issuer: 'MAESTRO INTERNATIONAL' },
  { bin: '579981', scheme: 'MAESTRO', type: 'DEBIT', category: 'STANDARD', issuer: 'MAESTRO INTERNATIONAL' },
  { bin: '559322', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD ELITE', issuer: 'RIYAD BANK' },
  { bin: '558854', scheme: 'MASTERCARD', type: 'CREDIT', category: 'EXECUTIVE', issuer: 'ALAWWAL BANK' },
  { bin: '558848', scheme: 'MASTERCARD', type: 'DEBIT', category: 'PLATINUM', issuer: 'ALAWWAL BANK' },
  { bin: '558705', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'SAUDI HOLLANDI BANK' },
  { bin: '558563', scheme: 'Mada', type: 'CREDIT', category: 'MasterCard', issuer: 'Riyadh Bank' },
  { bin: '557606', scheme: 'MASTERCARD', type: 'DEBIT', category: 'TITANIUM', issuer: 'ALAWWAL BANK' },
  { bin: '556676', scheme: 'MASTERCARD', type: 'CREDIT', category: 'CORPORATE', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '556675', scheme: 'MASTERCARD', type: 'CREDIT', category: 'CORPORATE', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '554575', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'AL-RAJHI BANKING AND INVESTMENT CORPORATION' },
  { bin: '554180', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'National Commercial Bank' },
  { bin: '554077', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'UNKNOWN' },
  { bin: '552438', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD', issuer: 'ALAWWAL BANK' },
  { bin: '552384', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD', issuer: 'SAUDI INVESTMENT BANK' },
  { bin: '552375', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD', issuer: 'ALAWWAL BANK' },
  { bin: '552363', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD', issuer: 'ALINMA BANK' },
  { bin: '552360', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD', issuer: 'BANQUE SAUDI FRANSI' },
  { bin: '552250', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD', issuer: 'SAMBA FINANCIAL GROUP' },
  { bin: '552089', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'SAMBA FINANCIAL GROUP' },
  { bin: '552077', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '552075', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '552012', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'BANQUE SAUDI FRANSI' },
  { bin: '550002', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'BANK ALJAZIRA' },
  { bin: '549964', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'AL-RAJHI BANKING AND INVESTMENT CORPORATION' },
  { bin: '549963', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'AL-RAJHI BANKING AND INVESTMENT CORPORATION' },
  { bin: '549954', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '549799', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'SAUDI BRITISH BANK, THE' },
  { bin: '549760', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'National Commercial Bank' },
  { bin: '549699', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '549400', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'ARAB NATIONAL BANK' },
  { bin: '548979', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'ALAWWAL BANK' },
  { bin: '548350', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'ALAWWAL BANK' },
  { bin: '548349', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'SAUDI HOLLANDI BANK' },
  { bin: '548323', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'RIYAD BANK' },
  { bin: '548322', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'RIYAD BANK' },
  { bin: '548255', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '547645', scheme: 'MASTERCARD', type: 'CREDIT', category: 'EXECUTIVE', issuer: 'SAUDI BRITISH BANK, THE' },
  { bin: '547042', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'BANQUE SAUDI FRANSI' },
  { bin: '547026', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'ALINMA BANK' },
  { bin: '546924', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD ELITE', issuer: 'BANK ALJAZIRA' },
  { bin: '546757', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'SAUDI BRITISH BANK' },
  { bin: '546756', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'SAUDI BRITISH BANK' },
  { bin: '546755', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'SAUDI BRITISH BANK, THE' },
  { bin: '546631', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '546336', scheme: 'MASTERCARD', type: 'DEBIT', category: 'PREPAID RELOADABLE', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '546319', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'UNKNOWN' },
  { bin: '545855', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'RIYAD BANK' },
  { bin: '545619', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'AL-RAJHI BANKING AND INVESTMENT CORPORATION' },
  { bin: '545318', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'SAUDI AMERICAN BANK' },
  { bin: '545297', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'SAUDI BRITISH BANK' },
  { bin: '545205', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '544873', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'SAMBA FINANCIAL GROUP' },
  { bin: '544744', scheme: 'MASTERCARD', type: 'DEBIT', category: 'PREPAID RELOADABLE', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '544229', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'SAMBA FINANCIAL GROUP' },
  { bin: '544217', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '544017', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'ARAB NATIONAL BANK' },
  { bin: '543683', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'SAMBA FINANCIAL GROUP' },
  { bin: '543522', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'UNKNOWN' },
  { bin: '543408', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'ALAWWAL BANK' },
  { bin: '543357', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'INMA Bank' },
  { bin: '543199', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'SAUDI BRITISH BANK, THE' },
  { bin: '543085', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'National Commercial Bank' },
  { bin: '542894', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'AL RAJHI BANKING AND INVESTMENT CORP.' },
  { bin: '542806', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'ARAB NATIONAL BANK' },
  { bin: '542805', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'SAMBA FINANCIAL GROUP' },
  { bin: '542747', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'BANQUE SAUDI FRANSI' },
  { bin: '542373', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'SAUDI INVESTMENT BANK' },
  { bin: '542008', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'ALAWWAL BANK' },
  { bin: '541988', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'RIYAD BANK' },
  { bin: '541891', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'NATIONAL COMMERCIAL BANK' },
  { bin: '541802', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD', issuer: 'RIYAD BANK' },
  { bin: '541679', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'RIYAD BANK' },
  { bin: '541653', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'SAUDI BRITISH BANK' },
  { bin: '541554', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'NATIONAL BANK OF BAHRAIN' },
  { bin: '540902', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'SAMBA FINANCIAL GROUP' },
  { bin: '540613', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '540236', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'SAUDI BRITISH BANK, THE' },
  { bin: '540000', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'SAMBA FINANCIAL GROUP' },
  { bin: '539931', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'ALAWWAL BANK' },
  { bin: '539859', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'RIYAD BANK' },
  { bin: '539035', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '539034', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '538854', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'UNKNOWN' },
  { bin: '537799', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD ELITE', issuer: 'SAMBA FINANCIAL GROUP' },
  { bin: '537767', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'Riyadh Bank' },
  { bin: '536813', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'ARAB NATIONAL BANK' },
  { bin: '536369', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '536023', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'Riyadh Bank' },
  { bin: '535989', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'Riyadh Bank' },
  { bin: '535825', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'National Commercial Bank' },
  { bin: '534186', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '533964', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD ELITE', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '533172', scheme: 'MASTERCARD', type: 'CREDIT', category: 'CORPORATE', issuer: 'ALAWWAL BANK' },
  { bin: '532448', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '532446', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '532166', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'NATIONAL COMMERCIAL BANK' },
  { bin: '532034', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD', issuer: 'UNKNOWN' },
  { bin: '532013', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'Saudi American Bank' },
  { bin: '531196', scheme: 'Mada', type: 'CREDIT', category: 'MasterCard', issuer: 'First Abu Dhabi Bank' },
  { bin: '531095', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'Saudi American Bank' },
  { bin: '530906', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'Saudi American Bank' },
  { bin: '530843', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'ALAWWAL BANK' },
  { bin: '530481', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'ALINMA BANK' },
  { bin: '530060', scheme: 'Mada', type: 'CREDIT', category: 'MasterCard', issuer: 'First Abu Dhabi Bank' },
  { bin: '529741', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'Riyadh Bank' },
  { bin: '529499', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'NATIONAL BANK OF BAHRAIN B. S. C.' },
  { bin: '529415', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'National Commercial Bank' },
  { bin: '529298', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'SAUDI INVESTMENT BANK' },
  { bin: '529178', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'ALINMA BANK' },
  { bin: '529157', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'ALINMA BANK' },
  { bin: '528479', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'SAMBA FINANCIAL GROUP' },
  { bin: '525688', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '524514', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'Riyadh Bank' },
  { bin: '524388', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '524266', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'ALRAJHI BANKING AND INVESTMENT CORPORATION' },
  { bin: '524236', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'BANK ALJAZIRA' },
  { bin: '524205', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'SAUDI INVESTMENT BANK' },
  { bin: '524197', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '524165', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'ALAWWAL BANK' },
  { bin: '524148', scheme: 'MASTERCARD', type: 'CREDIT', category: 'BUSINESS', issuer: 'BANQUE SAUDI FRANSI' },
  { bin: '524130', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'National Commercial Bank' },
  { bin: '524126', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'AL-RAJHI BANKING AND INVESTMENT CORPORATION' },
  { bin: '524116', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '523998', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '523970', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'SAMBA FINANCIAL GROUP' },
  { bin: '523968', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '523954', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '523041', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'BANK ALJAZIRA' },
  { bin: '522139', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'ALAWWAL BANK' },
  { bin: '521076', scheme: 'Mada', type: 'DEBIT', category: 'MasterCard', issuer: 'National Bank of Bahrain' },
  { bin: '521031', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '520431', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD BLACK', issuer: 'ARAB NATIONAL BANK' },
  { bin: '520430', scheme: 'MASTERCARD', type: 'CREDIT', category: 'TITANIUM', issuer: 'ARAB NATIONAL BANK' },
  { bin: '520090', scheme: 'MASTERCARD', type: 'CREDIT', category: 'CORPORATE', issuer: 'RIYAD BANK' },
  { bin: '520089', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'RIYAD BANK' },
  { bin: '520058', scheme: 'Mada', type: 'CREDIT', category: 'MasterCard', issuer: 'Riyadh Bank' },
  { bin: '519341', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '519310', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '518694', scheme: 'MASTERCARD', type: 'DEBIT', category: 'PREPAID RELOADABLE', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '517918', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'ARAB NATIONAL BANK' },
  { bin: '517724', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'BANQUE SAUDI FRANSI' },
  { bin: '517720', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '517532', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'BANK ALJAZIRA' },
  { bin: '517531', scheme: 'MASTERCARD', type: 'DEBIT', category: 'TITANIUM', issuer: 'RIYAD BANK' },
  { bin: '514932', scheme: 'MASTERCARD', type: 'CREDIT', category: 'PLATINUM', issuer: 'RIYAD BANK' },
  { bin: '514057', scheme: 'MASTERCARD', type: 'CREDIT', category: 'UNKNOWN', issuer: 'UNKNOWN' },
  { bin: '513213', scheme: 'Mada', type: 'CREDIT', category: 'MasterCard', issuer: 'Riyadh Bank' },
  { bin: '512727', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD ELITE', issuer: 'BANQUE SAUDI FRANSI' },
  { bin: '512691', scheme: 'MASTERCARD', type: 'CREDIT', category: 'CORPORATE', issuer: 'BANQUE SAUDI FRANSI' },
  { bin: '512623', scheme: 'MASTERCARD', type: 'CREDIT', category: 'STANDARD', issuer: 'AL-RAJHI BANKING AND INVESTMENT CORPORATION' },
  { bin: '512464', scheme: 'MASTERCARD', type: 'CREDIT', category: 'GOLD', issuer: 'NATIONAL COMMERCIAL BANK, THE' },
  { bin: '512060', scheme: 'MASTERCARD', type: 'CREDIT', category: 'WORLD REWARDS', issuer: 'SAUDI BRITISH BANK, THE' },
  { bin: '511249', scheme: 'MASTERCARD', type: 'DEBIT', category: 'STANDARD', issuer: 'UNKNOWN' },
  { bin: '508160', scheme: 'Mada', type: 'DEBIT', category: 'Local', issuer: 'Saudi American Bank' },
  { bin: '506968', scheme: 'MAESTRO', type: 'DEBIT', category: 'STANDARD', issuer: 'UNKNOWN' },
  { bin: '504300', scheme: 'Mada', type: 'DEBIT', category: 'Visa', issuer: 'Bank Al-Jazira' },
  { bin: '501828', scheme: 'MAESTRO', type: 'DEBIT', category: 'STANDARD', issuer: 'UNKNOWN' },
  { bin: '496655', scheme: 'VISA', type: 'CREDIT', category: 'REWARDS', issuer: 'BANQUE SAUDI FRANSI' },
  { bin: '496649', scheme: 'VISA', type: 'CREDIT', category: 'PLATINUM', issuer: 'SAMBA FINANCIAL GROUP' },
  { bin: '495892', scheme: 'VISA', type: 'CREDIT', category: 'UNKNOWN', issuer: 'UNKNOWN' },
  { bin: '494329', scheme: 'VISA', type: 'DEBIT', category: 'BUSINESS', issuer: 'AL RAJHI BANKING AND INVESTMENT CORP.' },
  { bin: '493985', scheme: 'VISA', type: 'CREDIT', category: 'UNKNOWN', issuer: 'UNKNOWN' },
  { bin: '493428', scheme: 'VISA', type: 'DEBIT', category: 'ELECTRON', issuer: 'SAUDI HOLLANDI BANK' },
  { bin: '492146', scheme: 'VISA', type: 'CREDIT', category: 'PLATINUM', issuer: 'NATIONAL COMMERCIAL BANK' },
  { bin: '492145', scheme: 'VISA', type: 'CREDIT', category: 'CLASSIC', issuer: 'NATIONAL COMMERCIAL BANK' },
  { bin: '491797', scheme: 'VISA', type: 'CREDIT', category: 'PLATINUM', issuer: 'NATIONAL COMMERCIAL BANK' },
  { bin: '491610', scheme: 'VISA', type: 'CREDIT', category: 'UNKNOWN', issuer: 'ARAB NATIONAL BANK' },
  { bin: '490980', scheme: 'VISA', type: 'DEBIT', category: 'ELECTRON', issuer: 'AL RAJHI BANKING AND INVESTMENT CORP.' },
  { bin: '490917', scheme: 'VISA', type: 'CREDIT', category: 'UNKNOWN', issuer: 'RIYAD BANK' }
];

async function seed() {
  const db = await setupDatabase();
  
  // Dynamically load all dumped text files
  const rawFiles = ['raw_bins.txt', 'raw_bins_2.txt'];
  for (const file of rawFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`Parsing massive dataset from ${file}...`);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (!line.trim() || line.startsWith('BIN/IIN')) continue;
        const parts = line.split('\t');
        if (parts.length >= 2) {
          saudiBins.push({
            bin: parts[0]?.trim(),
            scheme: parts[1]?.trim() || 'UNKNOWN',
            type: parts[2]?.trim() || 'UNKNOWN',
            category: parts[3]?.trim() || 'UNKNOWN',
            issuer: parts[4]?.trim() || 'UNKNOWN'
          });
        }
      }
    }
  }

  console.log(`Seeding ${saudiBins.length} Saudi Arabia BINs into Local Database...`);
  
  let inserted = 0;
  let updated = 0;

  for (const card of saudiBins) {
    try {
      await db.run(`
        INSERT INTO bins (bin, scheme, type, category, issuer, country, source)
        VALUES (?, ?, ?, ?, ?, ?, 'LOCAL_SEED')
      `, [card.bin, card.scheme, card.type, card.category, card.issuer, 'Saudi Arabia']);
      inserted++;
    } catch (e) {
      // If it exists, update it to make sure we have the latest data
      await db.run(`
        UPDATE bins 
        SET scheme = ?, type = ?, category = ?, issuer = ?, country = ?, source = 'LOCAL_SEED', updated_at = CURRENT_TIMESTAMP
        WHERE bin = ?
      `, [card.scheme, card.type, card.category, card.issuer, 'Saudi Arabia', card.bin]);
      updated++;
    }
  }
  console.log(`\n🎉 SQLite seeding complete! Inserted: ${inserted}, Updated: ${updated}`);
  console.log(`Local SQLite database contains ${inserted + updated} BIN records.`);

  // ── Sync all BINs to Supabase with RICH SCHEMA ───────────────────────────
  if (supabase) {
    console.log('\n☁️  Syncing BINs to Supabase with rich schema...');

    // Country metadata for enrichment
    const COUNTRY_META = {
      SA: { name: 'Saudi Arabia', currency: 'SAR', region: 'GCC' },
      US: { name: 'United States', currency: 'USD', region: 'Americas' },
      AE: { name: 'United Arab Emirates', currency: 'AED', region: 'GCC' },
      KW: { name: 'Kuwait', currency: 'KWD', region: 'GCC' },
      BH: { name: 'Bahrain', currency: 'BHD', region: 'GCC' },
    };

    function extractSubBrand(category = '') {
      const u = category.toUpperCase();
      if (u.includes('INFINITE'))    return 'INFINITE';
      if (u.includes('SIGNATURE'))   return 'SIGNATURE';
      if (u.includes('WORLD ELITE')) return 'WORLD ELITE';
      if (u.includes('WORLD BLACK')) return 'WORLD BLACK';
      if (u.includes('WORLD'))       return 'WORLD';
      if (u.includes('PLATINUM'))    return 'PLATINUM';
      if (u.includes('TITANIUM'))    return 'TITANIUM';
      if (u.includes('GOLD'))        return 'GOLD';
      if (u.includes('CLASSIC'))     return 'CLASSIC';
      if (u.includes('BUSINESS'))    return 'BUSINESS';
      if (u.includes('CORPORATE'))   return 'CORPORATE';
      if (u.includes('PREPAID'))     return 'PREPAID';
      if (u.includes('ELECTRON'))    return 'ELECTRON';
      return null;
    }

    const BATCH_SIZE = 500;
    let synced = 0;
    let failed = 0;

    for (let i = 0; i < saudiBins.length; i += BATCH_SIZE) {
      const batch = saudiBins.slice(i, i + BATCH_SIZE).map(card => ({
        bin:          card.bin,
        bin_length:   card.bin.length,
        scheme:       (card.scheme || 'UNKNOWN').toLowerCase(),
        type:         (card.type || 'UNKNOWN').toLowerCase(),
        category:     (card.category || 'STANDARD').toUpperCase(),
        sub_brand:    extractSubBrand(card.category || ''),
        prepaid:      (card.category || '').toUpperCase().includes('PREPAID'),
        pan_length:   16,
        luhn_valid:   true,
        issuer:       card.issuer || 'UNKNOWN',
        country_name: 'Saudi Arabia',
        country_code: 'SA',
        currency:     'SAR',
        region:       'GCC',
        source:       'LOCAL_SEED'
      }));

      const { error } = await supabase.from('bins').upsert(batch, { onConflict: 'bin' });
      if (error) {
        console.error(`[Supabase] Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
        failed += batch.length;
      } else {
        synced += batch.length;
        console.log(`[Supabase] ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${synced}/${saudiBins.length} synced`);
      }
    }

    console.log(`\n🌐 Supabase sync complete!`);
    console.log(`   Synced:  ${synced} BINs`);
    console.log(`   Failed:  ${failed} BINs`);
    console.log(`   Supabase is now the primary cloud BIN database.`);
  } else {
    console.log('\n⚠️  Supabase not configured — skipping cloud sync.');
    console.log('    Add SUPABASE_URL and SUPABASE_KEY to your .env file.');
  }
}

seed();
