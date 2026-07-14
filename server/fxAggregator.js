import axios from 'axios';

// SAR is rigidly pegged to USD globally
const SAR_USD_PEG = 3.75; 

export const fetchGlobalRates = async () => {
    try {
        // Fetch real-world ECB rates against the USD base
        const response = await axios.get('https://api.frankfurter.app/latest?from=USD');
        const data = response.data;
        const rates = data.rates;

        if (!rates) throw new Error("Invalid response from Frankfurter API");

        // We want to generate: SAR/INR, USD/EUR, SAR/USD, GBP/SAR
        // Base USD to INR: rates.INR
        // Base USD to EUR: rates.EUR
        // Base USD to GBP: rates.GBP

        const currentPairs = [];

        // 1. SAR/USD (Fixed Peg)
        currentPairs.push({ pair: 'SAR/USD', rate: 1 / SAR_USD_PEG });

        // 2. SAR/INR (How many INR for 1 SAR)
        // 1 SAR = (1/3.75) USD. Multiply by USD/INR rate.
        if (rates.INR) {
            const sarInr = (1 / SAR_USD_PEG) * rates.INR;
            currentPairs.push({ pair: 'SAR/INR', rate: sarInr });
        }

        // 3. USD/EUR
        if (rates.EUR) {
            currentPairs.push({ pair: 'USD/EUR', rate: rates.EUR });
        }

        // 4. GBP/SAR (How many SAR for 1 GBP)
        // 1 GBP = (1 / rates.GBP) USD. Multiply by 3.75 SAR.
        if (rates.GBP) {
            const gbpSar = (1 / rates.GBP) * SAR_USD_PEG;
            currentPairs.push({ pair: 'GBP/SAR', rate: gbpSar });
        }

        // 5. SAR/PHP (Philippines)
        if (rates.PHP) {
            const sarPhp = (1 / SAR_USD_PEG) * rates.PHP;
            currentPairs.push({ pair: 'SAR/PHP', rate: sarPhp });
        }

        // 6. SAR/PKR (Pakistan) - Simulated baseline as ECB doesn't track PKR natively
        // Around 278 PKR to 1 USD => 278 / 3.75 = ~74.13
        const sarPkr = (1 / SAR_USD_PEG) * 278.50;
        currentPairs.push({ pair: 'SAR/PKR', rate: sarPkr });

        // Optionally, add AUD/USD if it exists just to show multi-pair
        if (rates.AUD) {
            currentPairs.push({ pair: 'AUD/USD', rate: 1 / rates.AUD });
        }

        return currentPairs;
    } catch (error) {
        console.error('[Aggregator] Failed to fetch live rates from ECB Frankfurter API:', error.message);
        return [];
    }
};
