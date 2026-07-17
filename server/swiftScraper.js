import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabase } from './supabaseClient.js';

const BASE_URL = 'https://www.theswiftcodes.com';

// Helpful delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper with exponential backoff
async function fetchWithRetry(url, retries = 3, backoff = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'RemitWise-Fintech-Bot/1.0 (Contact: data@remitwise.fit) Mozilla/5.0'
                },
                timeout: 10000
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching ${url} (attempt ${i + 1}/${retries}): ${error.message}`);
            if (i === retries - 1) throw error;
            await delay(backoff * Math.pow(2, i));
        }
    }
}

// Map Country URL fragment to actual country name and code
// E.g. "/saudi-arabia/" -> Country: Saudi Arabia. 
// However, the site doesn't easily provide ISO codes in the table. We might need to extract it from the page or just store the country name.
function parseCountryName(path) {
    return path.replace(/\//g, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export async function scrapeSwiftCodesForCountry(countryPath) {
    console.log(`\n--- Scraping Country: ${countryPath} ---`);
    const countryName = parseCountryName(countryPath);
    let html;
    try {
        html = await fetchWithRetry(`${BASE_URL}${countryPath}`);
    } catch (e) {
        console.error(`Failed to load ${countryPath}, skipping.`);
        return;
    }

    const $ = cheerio.load(html);
    const codes = [];

    $('table.swift-country tr').each((i, row) => {
        if (i === 0) return; // Skip header

        const cells = $(row).find('td');
        if (cells.length >= 5) {
            const bankName = $(cells[1]).text().trim();
            const city = $(cells[2]).text().trim();
            const branch = $(cells[3]).text().trim();
            const swiftCode = $(cells[4]).text().trim().replace(/[^a-zA-Z0-9]/g, '');

            // Validate SWIFT length (8 or 11)
            if (swiftCode.length === 8 || swiftCode.length === 11) {
                codes.push({
                    country: countryName,
                    country_code: null, // Will try to infer later or leave null
                    bank_name: bankName,
                    city: city,
                    branch: branch,
                    swift_code: swiftCode,
                    address: ''
                });
            }
        }
    });

    console.log(`Extracted ${codes.length} valid SWIFT codes for ${countryName}.`);
    
    // Batch upsert to Supabase
    if (codes.length > 0 && supabase) {
        // Upsert in batches of 100 to avoid request too large errors
        const BATCH_SIZE = 100;
        for (let i = 0; i < codes.length; i += BATCH_SIZE) {
            const batch = codes.slice(i, i + BATCH_SIZE);
            const { error } = await supabase
                .from('swift_codes')
                .upsert(batch, { onConflict: 'swift_code' });
                
            if (error) {
                console.error(`Supabase Upsert Error for ${countryName}:`, error.message);
            } else {
                console.log(`Successfully upserted batch ${i/BATCH_SIZE + 1} (${batch.length} records).`);
            }
        }
    } else if (!supabase) {
        console.warn("Supabase client not initialized. Skipping DB upsert.");
    }
}

export async function runFullScraper() {
    console.log("=== STARTING FULL SWIFT CRAWL ===");
    try {
        const html = await fetchWithRetry(BASE_URL + '/browse-by-country/');
        const $ = cheerio.load(html);
        
        const countryLinks = [];
        // Extract country links. They usually look like <a href="/saudi-arabia/">
        $('.content a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith('/') && href.endsWith('/') && href.length > 3) {
                // Ignore non-country pages
                if (!['/browse-by-country/', '/swift-code-checker/', '/iban-checker/', '/routing-number-checker/'].includes(href)) {
                    countryLinks.push(href);
                }
            }
        });

        // Deduplicate
        const uniqueCountries = [...new Set(countryLinks)];
        console.log(`Found ${uniqueCountries.length} countries to scrape.`);

        for (const countryPath of uniqueCountries) {
            await scrapeSwiftCodesForCountry(countryPath);
            // Respectful delay between country pages (e.g., 2 seconds)
            await delay(2000);
        }

        console.log("=== FULL SWIFT CRAWL COMPLETED SUCCESSFULLY ===");
    } catch (e) {
        console.error("Critical error during full crawl:", e.message);
    }
}

// If run directly via node
if (process.argv[1] && process.argv[1].endsWith('swiftScraper.js')) {
    runFullScraper().then(() => process.exit(0)).catch(() => process.exit(1));
}
