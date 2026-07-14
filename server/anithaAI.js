import { GoogleGenerativeAI } from '@google/generative-ai';
import { getLiveRates } from './remittanceDB.js';
import dotenv from 'dotenv';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (geminiApiKey) {
    genAI = new GoogleGenerativeAI(geminiApiKey);
}

export const generateMarketPulse = async () => {
    if (!genAI) {
        return "Anitha AI™ is currently offline due to missing API keys.";
    }

    try {
        const rates = await getLiveRates();
        const ratesContext = rates.map(r => `${r.pair}: ${r.rate.toFixed(4)} (Spread: ${(r.spread * 100).toFixed(1)}%, Trend: ${r.trend})`).join(', ');

        const prompt = `
You are "Anitha AI™", an elite enterprise Risk & Remittance Analyst AI. 
Analyze the current live FX market data from our Intelligence Hub:
[${ratesContext}]

Write a razor-sharp, 2-3 sentence cognitive "Market Pulse" for the dashboard.
Focus on identifying volatility, recommending whether to widen spreads on specific corridors, or noting stable pairs.
Do NOT use markdown. Keep it strictly professional, authoritative, and concise.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error('Error generating Anitha AI Market Pulse:', error);
        return "Anitha AI™ is analyzing market conditions... (Data stream unstable)";
    }
};
