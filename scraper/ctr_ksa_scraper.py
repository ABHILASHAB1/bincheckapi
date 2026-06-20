import asyncio
import logging
import os
import re
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('CTR_Scraper')

async def extract_rates():
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Supabase credentials missing in .env file.")
        return

    # Vigorously clean the env variables to strip out any stray quotes or hidden Windows CRLF chars
    clean_url = SUPABASE_URL.strip().strip("'").strip('"').replace("\r", "").replace("\n", "")
    clean_key = SUPABASE_KEY.strip().strip("'").strip('"').replace("\r", "").replace("\n", "")
    
    logger.info(f"Connecting to Supabase at: '{clean_url}'")
    supabase: Client = create_client(clean_url, clean_key)
    
    url = "https://ctr-ksa.com/currency-rates"
    logger.info(f"Initializing advanced scraping engine for {url} ...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Target destinations to loop through
        target_countries = ['India', 'Pakistan', 'Philippines', 'Egypt', 'Bangladesh']
        all_rates = []
        
        try:
            # --- AUTOMATED BROWSER INTERACTION ---
            # For each country, we will simulate selecting the dropdowns and clicking check rate
            for country in target_countries:
                logger.info(f"Loading fresh page for corridor: Saudi Arabia -> {country}...")
                
                # We use "domcontentloaded" instead of "networkidle" because external ad-trackers 
                # keep the network active indefinitely, causing the 45s timeout.
                await page.goto(url, timeout=45000, wait_until="domcontentloaded")
                
                try:
                    country_map = {
                        "India": "India (INR)",
                        "Pakistan": "Pakistan (PKR)",
                        "Philippines": "Philippines (PHP)",
                        "Egypt": "Egypt (EGP)",
                        "Bangladesh": "Bangladesh (BDT)"
                    }
                    target_text = country_map.get(country)

                    # --- DOM MANIPULATION NAVIGATION ---
                    await page.wait_for_timeout(3000)
                    
                    # We bypass ALL finicky UI dropdowns (Select2, Nice-Select, etc.) entirely!
                    # We directly manipulate the underlying standard HTML <select> elements and fire a 'change' event.
                    
                    # 1. Set Country From (Saudi Arabia)
                    await page.evaluate('''() => {
                        const selects = Array.from(document.querySelectorAll('select'));
                        const fromSelect = selects.find(s => s.name && s.name.includes('from'));
                        if (fromSelect) {
                            for (let i = 0; i < fromSelect.options.length; i++) {
                                if (fromSelect.options[i].text.includes('Saudi Arabia')) {
                                    fromSelect.value = fromSelect.options[i].value;
                                    fromSelect.dispatchEvent(new Event('change', { bubbles: true }));
                                    break;
                                }
                            }
                        }
                    }''')
                    await page.wait_for_timeout(500)

                    # 2. Set Country To (Target Country) using the exact ID 'country_to_id'
                    await page.evaluate(f'''(targetText) => {{
                        const selectTo = document.getElementById('country_to_id');
                        if (selectTo) {{
                            for (let i = 0; i < selectTo.options.length; i++) {{
                                if (selectTo.options[i].text.includes(targetText)) {{
                                    selectTo.value = selectTo.options[i].value;
                                    selectTo.dispatchEvent(new Event('change', {{ bubbles: true }}));
                                    break;
                                }}
                            }}
                        }}
                    }}''', target_text)
                    await page.wait_for_timeout(500)

                    # 3. Click CHECK RATES
                    await page.evaluate('''() => {
                        const btns = Array.from(document.querySelectorAll('button, a'));
                        const checkBtn = btns.find(el => el.textContent.includes('CHECK RATES'));
                        if (checkBtn) checkBtn.click();
                    }''')
                    
                    # Wait 10 seconds for the external API to respond and UI to render!
                    logger.info("Waiting 10 seconds for the rate data to load...")
                    await page.wait_for_timeout(10000)
                    
                except Exception as e:
                    logger.warning(f"Could not automate dropdown for {country}. Error: {str(e)[:100]}")
                
                # --- PARSING MULTIPLE PROVIDERS WITH ROBUST DOM NAVIGATION ---
                html = await page.content()
                soup = BeautifulSoup(html, 'html.parser')
                
                provider_boxes = soup.find_all('div', class_='convert-box mb-5')
                
                for box in provider_boxes:
                    try:
                        # 1. Provider Name (Usually in the first row next to an image)
                        provider_img = box.find('img')
                        provider_name = "Unknown Provider"
                        if provider_img:
                            provider_name_span = provider_img.find_next_sibling('span')
                            if provider_name_span:
                                provider_name = provider_name_span.text.strip()
                        
                        b2b_rate = None
                        b2b_charge = 0.0
                        cash_rate = None
                        cash_charge = 0.0
                        transfer_time = "Standard"
                        currency = "UNK"
                        
                        # 2. Process each row inside the provider box to find Rates and Charges
                        rows = box.find_all('div', class_='row')
                        for row in rows:
                            text_content = row.get_text()
                            
                            # Bank to Bank Row
                            if "Bank To Bank Rates" in text_content:
                                cols = row.find_all('div', class_='col-lg-3')
                                if len(cols) >= 4:
                                    rate_str = cols[0].find_all('span')[-1].text # e.g. "25.358 INR"
                                    charge_str = cols[1].find_all('span')[-1].text # e.g. "0 SAR"
                                    time_str = cols[2].find_all('span')[-1].text # e.g. "Same day"
                                    
                                    rmatch = re.search(r'(\d+(?:\.\d+)?)\s*([A-Z]{3})', rate_str)
                                    if rmatch:
                                        b2b_rate = float(rmatch.group(1))
                                        currency = rmatch.group(2)
                                        
                                    cmatch = re.search(r'(\d+(?:\.\d+)?)\s*SAR', charge_str)
                                    if cmatch:
                                        b2b_charge = float(cmatch.group(1))
                                        
                                    if time_str.strip():
                                        transfer_time = time_str.strip()
                                        
                            # Cash Pickup Row
                            elif "Cash Pickup Rates" in text_content:
                                cols = row.find_all('div', class_='col-lg-3')
                                if len(cols) >= 4:
                                    rate_str = cols[0].find_all('span')[-1].text 
                                    charge_str = cols[1].find_all('span')[-1].text
                                    
                                    rmatch = re.search(r'(\d+(?:\.\d+)?)\s*([A-Z]{3})', rate_str)
                                    if rmatch:
                                        cash_rate = float(rmatch.group(1))
                                        
                                    cmatch = re.search(r'(\d+(?:\.\d+)?)\s*SAR', charge_str)
                                    if cmatch:
                                        cash_charge = float(cmatch.group(1))
                                        
                        # If we successfully captured the B2B Rate, save this provider to DB!
                        if b2b_rate:
                            all_rates.append({
                                'bank_name': provider_name,
                                'base_currency': 'SAR',
                                'target_currency': currency,
                                'buy_rate': b2b_rate,
                                'sell_rate': cash_rate if cash_rate is not None else b2b_rate,
                                'b2b_charge_sar': b2b_charge,
                                'cash_charge_sar': cash_charge,
                                'transfer_type': transfer_time,
                                'updated_at': datetime.now(timezone.utc).isoformat()
                            })
                            logger.info(f"Captured {provider_name} ({currency}): B2B Rate: {b2b_rate}, Fee: {b2b_charge} SAR")
                            
                    except Exception as box_err:
                        logger.warning(f"Failed to parse a provider box: {str(box_err)[:100]}")
                
                # Small delay before next interaction
                await asyncio.sleep(2)

            # --- DATA SYNCHRONIZATION ---
            if all_rates:
                logger.info(f"Preparing to sync {len(all_rates)} corridors...")
                
                # 1. Local Fallback Backup (100% Guaranteed Save)
                try:
                    import json
                    with open("scraper/latest_rates.json", "w", encoding="utf-8") as f:
                        json.dump(all_rates, f, indent=4)
                    logger.info("✅ Successfully saved scraped data to scraper/latest_rates.json")
                except Exception as local_err:
                    logger.warning(f"Failed to save locally: {local_err}")
                
                # 2. Supabase Cloud Sync
                try:
                    # Strip out columns that don't exist in the remote Supabase schema
                    db_safe_rates = []
                    for r in all_rates:
                        db_safe_rates.append({
                            'bank_name': r['bank_name'],
                            'base_currency': r['base_currency'],
                            'target_currency': r['target_currency'],
                            'buy_rate': r['buy_rate'],
                            'sell_rate': r['sell_rate'],
                            'updated_at': r['updated_at']
                        })

                    # Upsert to Current Live Rates Table (bank_fx_rates)
                    res_live = supabase.table('bank_fx_rates').upsert(
                        db_safe_rates, 
                        on_conflict='bank_name,target_currency'
                    ).execute()
                    logger.info(f"✅ Upserted {len(res_live.data)} records to LIVE bank_fx_rates table.")
                    
                    # Insert into Historical Logging Table (for future charts/searches)
                    res_hist = supabase.table('saudi_fx_history').insert(db_safe_rates).execute()
                    logger.info(f"✅ Appended {len(res_hist.data)} records to HISTORICAL saudi_fx_history table.")
                    
                except Exception as db_err:
                    logger.error(f"❌ Database synchronization failed: {db_err}")
            else:
                logger.warning("No rates could be confidently extracted. The page structure may have changed or the dropdown interaction failed.")
                logger.warning("Attempting to dump HTML for debugging...")
                with open("error_dump.html", "w", encoding="utf-8") as f:
                    f.write(html)

        except Exception as e:
            logger.error(f"Critical error during scraping: {str(e)}")
        finally:
            await browser.close()
            logger.info("Browser closed. Scraping session ended.")

if __name__ == "__main__":
    asyncio.run(extract_rates())
