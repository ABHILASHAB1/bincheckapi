import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import axios from 'axios';
import { supabase } from './supabaseClient.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
const geminiApiKey = process.env.GEMINI_API_KEY;
let bot = null;
let db = null;
let genAI = null;

// Initialize bot if token exists
export const initTelegramBot = async () => {
    if (!token) {
        console.warn('⚠️ TELEGRAM_BOT_TOKEN not found in .env. Telegram integration disabled.');
        return;
    }

    // Prevents 409 Conflict by stopping your local computer from stealing the bot connection
    if (process.env.NODE_ENV !== 'production' && !process.env.RENDER) {
        console.warn('⚠️ Running locally! Telegram Bot polling is DISABLED so the live Render server can work without interference.');
        return;
    }

    try {
        db = await open({
            filename: 'server/bins.sqlite',
            driver: sqlite3.Database
        });

        // Create table for bot subscribers if it doesn't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS telegram_subscribers (
                chat_id TEXT PRIMARY KEY,
                username TEXT,
                registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        bot = new TelegramBot(token, { polling: true });
        console.log('✅ Telegram Bot initialized and polling...');

        // Register new users who message the bot
        bot.onText(/\/start|\/register/, async (msg) => {
            const chatId = msg.chat.id;
            const username = msg.from.username || msg.from.first_name;

            try {
                await db.run(
                    'INSERT OR IGNORE INTO telegram_subscribers (chat_id, username) VALUES (?, ?)',
                    [chatId.toString(), username]
                );
                bot.sendMessage(chatId, `🏦 *Enterprise FX Simulator*\n\nWelcome ${username}! You are now registered to receive real-time alerts for significant cross-border FX market volatility and clearing updates.`, { parse_mode: 'Markdown' });
                console.log(`[Telegram] Registered new subscriber: ${chatId}`);
            } catch (err) {
                console.error('Error saving telegram subscriber:', err);
            }
        });

        // Simple status command
        bot.onText(/\/status/, (msg) => {
            bot.sendMessage(msg.chat.id, '🟢 *System Status: ONLINE*\n\nFX Market Simulation Engine is actively polling and updating rates.', { parse_mode: 'Markdown' });
        });

        // Admin command to manually override FX Rates
        // Usage: /override SAR/INR 23.50
        // Usage: /override SAR/INR 23.50 STC Pay 15-07-2026
        bot.onText(/\/override ([a-zA-Z]{3})\/([a-zA-Z]{3}) ([\d.]+)(?:\s+(.+))?/i, async (msg, match) => {
            const chatId = msg.chat.id;
            const pair = `${match[1].toUpperCase()}/${match[2].toUpperCase()}`;
            const newRate = parseFloat(match[3]);
            let rawExtra = (match[4] || '').trim();

            let provider = 'Admin Override';
            let targetDate = new Date().toISOString();

            const dateRegex = /\b(\d{2})-(\d{2})-(\d{4})\b$/;
            const dateMatch = rawExtra.match(dateRegex);

            if (dateMatch) {
                const day = parseInt(dateMatch[1], 10);
                const month = parseInt(dateMatch[2], 10) - 1;
                const year = parseInt(dateMatch[3], 10);
                targetDate = new Date(Date.UTC(year, month, day, 12, 0, 0)).toISOString();
                rawExtra = rawExtra.replace(dateRegex, '').trim();
            }

            if (rawExtra) {
                provider = rawExtra;
            }

            if (isNaN(newRate)) {
                return bot.sendMessage(chatId, '❌ Invalid rate format. Usage: `/override SAR/INR 22.50 [Provider] [dd-mm-yyyy]`', { parse_mode: 'Markdown' });
            }

            try {
                // Check if pair exists
                const existing = await db.get('SELECT pair, rate FROM fx_rates WHERE pair = ?', [pair]);
                if (!existing) {
                    return bot.sendMessage(chatId, `⚠️ Pair *${pair}* not found in the database. Active pairs: SAR/INR, USD/EUR, SAR/USD, GBP/SAR`, { parse_mode: 'Markdown' });
                }

                // Update the database
                const trend = newRate > existing.rate ? 'up' : 'down';
                await db.run(
                    'UPDATE fx_rates SET rate = ?, trend = ?, updated_at = CURRENT_TIMESTAMP WHERE pair = ?',
                    [newRate, trend, pair]
                );

                // ALSO update Supabase so Remitwise UI syncs immediately
                if (supabase) {
                    const [base, target] = pair.split('/');
                    await supabase.from('bank_fx_rates').insert([{
                        bank_name: provider,
                        base_currency: base,
                        target_currency: target,
                        buy_rate: newRate,
                        sell_rate: newRate,
                        transfer_type: 'international_transfer',
                        updated_at: targetDate
                    }]);
                }

                bot.sendMessage(chatId, `✅ *FX Rate Manually Overridden*\n\n**${pair}** is now firmly set to \`${newRate.toFixed(4)}\`.\n\nThe simulation engine will now use this as the new market baseline.`, { parse_mode: 'Markdown' });
                console.log(`[Telegram] Manual rate override by ${msg.from.username}: ${pair} -> ${newRate}`);
            } catch (err) {
                console.error('Error updating manual rate:', err);
                bot.sendMessage(chatId, '❌ Database error while updating rate.');
            }
        });

        // ----------------------------------------------------
        // Gemini AI Image Parsing (Optical FX Extraction)
        // ----------------------------------------------------
        if (geminiApiKey) {
            genAI = new GoogleGenerativeAI(geminiApiKey);
            
            bot.on('message', async (msg) => {
                const chatId = msg.chat.id;

                // --- NEW DIAGNOSTIC COMMAND: /models ---
                if (msg.text && msg.text.startsWith('/models')) {
                    try {
                        bot.sendMessage(chatId, "🔍 Fetching available Gemini models for your API key...");
                        
                        // Unfortunately, the Node SDK doesn't expose listModels cleanly in all versions.
                        // We will use raw fetch to call the REST API.
                        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
                        const models = response.data.models;
                        
                        const generateContentModels = models
                            .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                            .map(m => m.name.replace('models/', ''))
                            .join('\n- ');

                        bot.sendMessage(chatId, `✅ **Supported Models for generateContent:**\n\n- ${generateContentModels}`, { parse_mode: 'Markdown' });
                    } catch (err) {
                        bot.sendMessage(chatId, `❌ **Failed to fetch models:**\n${err.message}`);
                    }
                    return;
                }
            });

            bot.on('photo', async (msg) => {
                const chatId = msg.chat.id;
                
                // Extract date from caption if present (dd-mm-yyyy)
                let imageTimestamp = new Date().toISOString();
                if (msg.caption) {
                    const captionRegex = /\b(\d{2})-(\d{2})-(\d{4})\b/;
                    const match = msg.caption.match(captionRegex);
                    if (match) {
                        const day = parseInt(match[1], 10);
                        const month = parseInt(match[2], 10) - 1;
                        const year = parseInt(match[3], 10);
                        imageTimestamp = new Date(Date.UTC(year, month, day, 12, 0, 0)).toISOString();
                    }
                }
                
                // Telegram sends multiple sizes; get the largest one
                const highestResPhoto = msg.photo[msg.photo.length - 1];
                
                try {
                    bot.sendMessage(chatId, '🤖 *Processing Image...*\nExtracting FX Rates via Gemini 1.5 Flash Vision.', { parse_mode: 'Markdown' });
                    
                    // 1. Get the download URL for the image
                    const fileLink = await bot.getFileLink(highestResPhoto.file_id);
                    
                    // 2. Download the image into a buffer
                    const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
                    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
                    
                    // --- SUPABASE STORAGE: Archive Screenshot ---
                    let uploadedImageUrl = null;
                    let scanId = null;
                    if (supabase) {
                        try {
                            const fileName = `${Date.now()}_${chatId}.jpg`;
                            const { error: storageError } = await supabase.storage
                                .from('screenshots')
                                .upload(fileName, response.data, {
                                    contentType: 'image/jpeg',
                                    upsert: false
                                });
                            
                            if (!storageError) {
                                const { data: publicUrlData } = supabase.storage.from('screenshots').getPublicUrl(fileName);
                                uploadedImageUrl = publicUrlData.publicUrl;
                            }
                            
                            // Create fx_scan session
                            const { data: scanData, error: scanError } = await supabase.from('fx_scan').insert([{
                                app_name: 'Telegram Bot',
                                image_url: uploadedImageUrl,
                                ocr_engine: 'gemini',
                                validation_status: 'pending'
                            }]).select('id').single();
                            
                            if (!scanError && scanData) {
                                scanId = scanData.id;
                            }
                        } catch (err) {
                            console.error('Failed to create fx_scan record or upload image:', err.message);
                        }
                    }

                    // 3. Call Gemini Vision Model with Enterprise Fallback
                    const fallbackModels = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
                    const prompt = `
You are an expert financial Optical Character Recognition (OCR) system.
Extract EVERY currency pair and its buy/sell rates from the provided image.
Return ONLY a strictly formatted JSON array of objects with the following keys:
- "bank_name": The name of the bank or provider (e.g., "Transfast", "STC PAY", "Interbank").
- "base_currency": The base currency code (e.g., "SAR").
- "target_currency": The target currency code (e.g., "INR").
- "buy_rate": The buy rate or primary exchange rate as a number.
- "sell_rate": The sell rate as a number (optional).
Example format: [{"bank_name": "Transfast (Urpay)", "base_currency": "SAR", "target_currency": "INR", "buy_rate": 25.308, "sell_rate": 25.193}]
                    `;

                    let result = null;
                    let lastError = null;
                    let successfulModel = null;

                    for (const modelName of fallbackModels) {
                        try {
                            const model = genAI.getGenerativeModel({ model: modelName });
                            result = await model.generateContent([
                                prompt,
                                {
                                    inlineData: {
                                        data: base64Image,
                                        mimeType: "image/jpeg"
                                    }
                                }
                            ], {
                                generationConfig: {
                                    responseMimeType: "application/json"
                                }
                            });
                            
                            successfulModel = modelName;
                            console.log(`[Gemini] Successfully extracted using ${modelName}`);
                            break; // Exit loop on success
                        } catch (err) {
                            console.warn(`[Gemini] ${modelName} failed (${err.message}). Trying next fallback...`);
                            lastError = err;
                        }
                    }

                    if (!result) {
                        throw lastError; // Throw the last encountered error if all fail
                    }
                    
                    const responseText = result.response.text().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
                    let parsedData = JSON.parse(responseText);
                    
                    // Normalize single object to array just in case Gemini disobeys
                    if (!Array.isArray(parsedData)) {
                        parsedData = [parsedData];
                    }

                    if (parsedData.length === 0) {
                        throw new Error("No currency pairs detected in image.");
                    }

                    let successfulUpdates = [];

                    // 4. Update the Databases (Supabase + SQLite)
                    for (const item of parsedData) {
                        const extractedRate = item.buy_rate || item.rate || item.exchange_rate;
                        if (!item.base_currency || !item.target_currency || !extractedRate) continue;

                        const bankName = item.bank_name || 'Interbank / AI Extracted';
                        const baseCurrency = item.base_currency.toUpperCase();
                        const targetCurrency = item.target_currency.toUpperCase();
                        const buyRate = parseFloat(extractedRate);
                        const sellRate = item.sell_rate ? parseFloat(item.sell_rate) : buyRate;
                        // Use the extracted image timestamp
                        const updatedTimestamp = imageTimestamp;

                        const sqlitePair = `${baseCurrency}_${targetCurrency}`;
                        // Calculate a synthetic spread for the UI based on buy/sell difference
                        const syntheticSpread = (sellRate && sellRate !== buyRate) ? Math.abs((buyRate - sellRate) / buyRate) : 0.01;
                        // Use mid-rate for the primary display rate
                        const midRate = sellRate ? (buyRate + sellRate) / 2 : buyRate;

                        // --- SUPABASE ADVANCED ARCHITECTURE ---
                        if (supabase) {
                            try {
                                // 1. Log Raw Extraction Row
                                if (scanId) {
                                    await supabase.from('fx_scan_rows').insert([{
                                        scan_id: scanId,
                                        provider: bankName,
                                        rate: midRate,
                                        updated_at_text: updatedTimestamp,
                                        confidence: 99.0 // Stubbed for Gemini, will be dynamic for PaddleOCR later
                                    }]);
                                }

                                // 2. Finalize into Master Audit Log (bank_fx_rates)
                                await supabase.from('bank_fx_rates').upsert([{
                                    bank_name: bankName,
                                    base_currency: baseCurrency,
                                    target_currency: targetCurrency,
                                    buy_rate: buyRate,
                                    sell_rate: sellRate,
                                    updated_at: updatedTimestamp
                                }], { onConflict: 'bank_name,target_currency' });
                                console.log(`[Supabase] Logged ${sqlitePair} into bank_fx_rates & fx_scan_rows`);
                            } catch (e) {
                                console.error('[Supabase] Architectural Insert failed:', e);
                            }
                        }

                        // --- SQLITE LIVE SIMULATOR UPSERT ---
                        const sqlitePairDisplay = `${baseCurrency}/${targetCurrency}`;
                        
                        const existing = await db.get('SELECT rate, spread FROM fx_rates WHERE pair = ?', [sqlitePairDisplay]);
                        
                        if (!existing) {
                            // Insert new pair dynamically
                            await db.run(
                                'INSERT INTO fx_rates (pair, rate, spread, trend, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
                                [sqlitePairDisplay, midRate, syntheticSpread, 'stable']
                            );
                            successfulUpdates.push(`${sqlitePairDisplay}: \`${midRate.toFixed(4)}\` (NEW) via ${bankName}`);
                        } else {
                            // Update existing pair
                            const trend = midRate > existing.rate ? 'up' : 'down';
                            await db.run(
                                'UPDATE fx_rates SET rate = ?, spread = ?, trend = ?, updated_at = CURRENT_TIMESTAMP WHERE pair = ?',
                                [midRate, syntheticSpread, trend, sqlitePairDisplay]
                            );
                            successfulUpdates.push(`${sqlitePairDisplay}: \`${midRate.toFixed(4)}\` via ${bankName}`);
                        }
                        
                        console.log(`[Telegram AI] Extracted & Upserted ${sqlitePairDisplay} -> ${midRate}`);
                    }

                    bot.sendMessage(chatId, `✅ *AI Enterprise Data Sync Successful*\n_(Extracted via ${successfulModel})_\n\n${successfulUpdates.join('\n')}\n\nBoth SQLite Simulation and Supabase Audit Log have been updated.`, { parse_mode: 'Markdown' });
                    
                } catch (error) {
                    console.error('Error processing image with Gemini:', error);
                    bot.sendMessage(chatId, `❌ AI Parsing Failed.\n\nReason: ${error.message}\n\nCould not extract a valid currency pair and rate from the image.`);
                }
            });
        }

    } catch (err) {
        console.error('❌ Failed to initialize Telegram Bot:', err);
    }
};

export const broadcastFXAlert = async (pair, oldRate, newRate, spread) => {
    if (!bot || !db) return;

    try {
        const subscribers = await db.all('SELECT chat_id FROM telegram_subscribers');
        if (subscribers.length === 0) return;

        const trendEmoji = newRate > oldRate ? '📈' : '📉';
        const trendText = newRate > oldRate ? 'UP' : 'DOWN';
        const percentChange = (((newRate - oldRate) / oldRate) * 100).toFixed(2);

        const message = `
🚨 *FX VOLATILITY ALERT* 🚨

${trendEmoji} **${pair}** is ${trendText} (${percentChange}%)
• Previous Rate: \`${oldRate.toFixed(4)}\`
• New Rate: \`${newRate.toFixed(4)}\`
• Active Spread Margin: \`${(spread * 100).toFixed(2)}%\`

_Enterprise FX Simulation Engine_
        `;

        for (const sub of subscribers) {
            bot.sendMessage(sub.chat_id, message, { parse_mode: 'Markdown' }).catch(err => {
                console.error(`Failed to send alert to ${sub.chat_id}:`, err.message);
            });
        }
    } catch (err) {
        console.error('Error broadcasting FX alert:', err);
    }
};

export const broadcastNewUserAlert = async (pageUrl, userAgent) => {
    if (!bot || !db) return;

    try {
        const subscribers = await db.all('SELECT chat_id FROM telegram_subscribers');
        if (subscribers.length === 0) return;

        // Parse user agent minimally
        let device = 'Desktop';
        if (/mobile/i.test(userAgent)) device = 'Mobile';
        if (/bot|crawl|spider/i.test(userAgent)) device = 'Bot';

        const message = `
👤 *New Visitor Detected* 
• Page: \`${pageUrl}\`
• Device: \`${device}\`
        `;

        for (const sub of subscribers) {
            bot.sendMessage(sub.chat_id, message, { parse_mode: 'Markdown' }).catch(err => {
                console.error(`Failed to send new user alert to ${sub.chat_id}:`, err.message);
            });
        }
    } catch (err) {
        console.error('Error broadcasting new user alert:', err);
    }
};

export const broadcastContactAlert = async (contactData) => {
    if (!bot || !db) return;

    try {
        const subscribers = await db.all('SELECT chat_id FROM telegram_subscribers');
        if (subscribers.length === 0) return;

        const message = `
📬 *New Contact Form Submission*
• *Name:* \`${contactData.firstName} ${contactData.lastName}\`
• *Email:* \`${contactData.email}\`
• *Message:* 
_${contactData.message}_
        `;

        for (const sub of subscribers) {
            bot.sendMessage(sub.chat_id, message, { parse_mode: 'Markdown' }).catch(err => {
                console.error(`Failed to send contact alert to ${sub.chat_id}:`, err.message);
            });
        }
    } catch (err) {
        console.error('Error broadcasting contact alert:', err);
    }
};

export const broadcastSupportBotAlert = async (supportData) => {
    if (!bot || !db) return;

    try {
        const subscribers = await db.all('SELECT chat_id FROM telegram_subscribers');
        if (subscribers.length === 0) return;

        const message = `
🎧 *Customer Support Bot Message*
• *Name:* \`${supportData.name}\`
• *Email:* \`${supportData.email}\`
• *Phone:* \`+966 ${supportData.phone}\`
• *Subject:* \`${supportData.subject}\`
• *Message:* 
_${supportData.message}_
        `;

        for (const sub of subscribers) {
            bot.sendMessage(sub.chat_id, message, { parse_mode: 'Markdown' }).catch(err => {
                console.error(`Failed to send support bot alert to ${sub.chat_id}:`, err.message);
            });
        }
    } catch (err) {
        console.error('Error broadcasting support bot alert:', err);
    }
};
