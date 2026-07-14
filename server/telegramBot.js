import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import axios from 'axios';
import { supabase } from './supabaseClient.js';

dotenv.config();

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
        // Usage: /setrate SAR/INR 23.50
        bot.onText(/\/setrate (.+) ([\d.]+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const pair = match[1].toUpperCase();
            const newRate = parseFloat(match[2]);

            if (isNaN(newRate)) {
                return bot.sendMessage(chatId, '❌ Invalid rate format. Usage: `/setrate SAR/INR 22.50`', { parse_mode: 'Markdown' });
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
            
            bot.on('photo', async (msg) => {
                const chatId = msg.chat.id;
                
                // Telegram sends multiple sizes; get the largest one
                const highestResPhoto = msg.photo[msg.photo.length - 1];
                
                try {
                    bot.sendMessage(chatId, '🤖 *Processing Image...*\nExtracting FX Rates via Gemini 1.5 Flash Vision.', { parse_mode: 'Markdown' });
                    
                    // 1. Get the download URL for the image
                    const fileLink = await bot.getFileLink(highestResPhoto.file_id);
                    
                    // 2. Download the image into a buffer
                    const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
                    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
                    
                    // 3. Call Gemini Vision Model
                    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
                    const prompt = `
You are an expert financial Optical Character Recognition (OCR) system.
Extract EVERY currency pair and its buy/sell rates from the provided image.
Return ONLY a strictly formatted JSON array of objects with the following keys:
- "bank_name": The name of the bank or provider (e.g., "Transfast (Urpay)", "STC PAY").
- "base_currency": The base currency code (e.g., "SAR").
- "target_currency": The target currency code (e.g., "INR").
- "buy_rate": The buy rate as a number.
- "sell_rate": The sell rate as a number.
Example format: [{"bank_name": "Transfast (Urpay)", "base_currency": "SAR", "target_currency": "INR", "buy_rate": 25.308, "sell_rate": 25.193}]
                    `;

                    const result = await model.generateContent([
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
                        if (!item.base_currency || !item.target_currency || !item.buy_rate) continue;

                        const bankName = item.bank_name || 'AI Extracted';
                        const baseCurrency = item.base_currency.toUpperCase();
                        const targetCurrency = item.target_currency.toUpperCase();
                        const buyRate = parseFloat(item.buy_rate);
                        const sellRate = item.sell_rate ? parseFloat(item.sell_rate) : buyRate;
                        const updatedTimestamp = new Date().toISOString();

                        // --- SUPABASE AUDIT LOG (bank_fx_rates) ---
                        if (supabase) {
                            try {
                                await supabase.from('bank_fx_rates').insert([{
                                    bank_name: bankName,
                                    base_currency: baseCurrency,
                                    target_currency: targetCurrency,
                                    buy_rate: buyRate,
                                    sell_rate: sellRate,
                                    transfer_type: 'international_transfer',
                                    updated_at: updatedTimestamp
                                }]);
                                console.log(`[Supabase] Logged ${baseCurrency}/${targetCurrency} into bank_fx_rates`);
                            } catch (e) {
                                console.error('[Supabase] Insert failed:', e);
                            }
                        }

                        // --- SQLITE LIVE SIMULATOR UPSERT ---
                        const sqlitePair = `${baseCurrency}/${targetCurrency}`;
                        // Calculate a synthetic spread for the UI based on buy/sell difference
                        const syntheticSpread = (sellRate && sellRate !== buyRate) ? Math.abs((buyRate - sellRate) / buyRate) : 0.01;
                        // Use mid-rate for the primary display rate
                        const midRate = sellRate ? (buyRate + sellRate) / 2 : buyRate;

                        const existing = await db.get('SELECT rate, spread FROM fx_rates WHERE pair = ?', [sqlitePair]);
                        
                        if (!existing) {
                            // Insert new pair dynamically
                            await db.run(
                                'INSERT INTO fx_rates (pair, rate, spread, trend, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
                                [sqlitePair, midRate, syntheticSpread, 'stable']
                            );
                            successfulUpdates.push(`${sqlitePair}: \`${midRate.toFixed(4)}\` (NEW) via ${bankName}`);
                        } else {
                            // Update existing pair
                            const trend = midRate > existing.rate ? 'up' : 'down';
                            await db.run(
                                'UPDATE fx_rates SET rate = ?, spread = ?, trend = ?, updated_at = CURRENT_TIMESTAMP WHERE pair = ?',
                                [midRate, syntheticSpread, trend, sqlitePair]
                            );
                            successfulUpdates.push(`${sqlitePair}: \`${midRate.toFixed(4)}\` via ${bankName}`);
                        }
                        
                        console.log(`[Telegram AI] Extracted & Upserted ${sqlitePair} -> ${midRate}`);
                    }

                    bot.sendMessage(chatId, `✅ *AI Enterprise Data Sync Successful*\n\n${successfulUpdates.join('\n')}\n\nBoth SQLite Simulation and Supabase Audit Log have been updated.`, { parse_mode: 'Markdown' });
                    
                } catch (error) {
                    console.error('Error processing image with Gemini:', error);
                    bot.sendMessage(chatId, '❌ AI Parsing Failed. Could not extract a valid currency pair and rate from the image.');
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
