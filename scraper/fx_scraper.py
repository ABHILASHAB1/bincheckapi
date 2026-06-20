import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import List, Dict, Any

from bs4 import BeautifulSoup
from dotenv import load_dotenv
from playwright.async_api import async_playwright, Page, BrowserContext
from supabase import create_client, Client

# Configure Structured Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('Saudi_FX_Engine')

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

class BankScraperConfig:
    """Configuration class for individual bank targets."""
    def __init__(self, name: str, url: str):
        self.name = name
        self.url = url

class SaudiFXScraper:
    def __init__(self):
        """Initialize the scraper and Supabase client."""
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("CRITICAL: Supabase credentials missing in .env file.")
        
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Target Banking Institutions
        self.banks = [
            BankScraperConfig("Al Rajhi Bank", "https://www.alrajhibank.com.sa/en/pricing/exchange-rates"),
            BankScraperConfig("SNB", "https://www.alahli.com/en-us/personal-banking/Pages/Currency-Exchange-Rates.aspx"),
            BankScraperConfig("Riyad Bank", "https://www.riyadbank.com/en/about-us/currency-exchange-rates"),
            BankScraperConfig("Alinma Bank", "https://www.alinma.com/en/currency-exchange-rates"),
            BankScraperConfig("SAIB", "https://www.saib.com.sa/en/exchange-rates")
        ]

    async def _extract_with_bs4(self, html: str, bank_name: str) -> List[Dict[str, Any]]:
        """Fallback mechanism to parse static tables if Playwright dynamic selection fails."""
        soup = BeautifulSoup(html, 'html.parser')
        rates = []
        
        # NOTE: In a production environment, these selectors must be tailored to the exact DOM 
        # structure of each bank. This serves as a robust structural fallback template.
        tables = soup.find_all('table')
        if not tables:
            logger.warning(f"[{bank_name}] No tables found for fallback parsing.")
            return rates

        for row in tables[0].find_all('tr')[1:]:  # Skip header row
            cols = row.find_all(['td', 'th'])
            if len(cols) >= 3:
                try:
                    currency_raw = cols[0].text.strip()
                    # Standardize currency to 3 letters (e.g., "USD - US Dollar" -> "USD")
                    currency = currency_raw[:3].upper() 
                    
                    buy = float(cols[1].text.strip().replace(',', ''))
                    sell = float(cols[2].text.strip().replace(',', ''))
                    
                    if len(currency) == 3 and currency.isalpha():
                        rates.append(self._format_record(bank_name, currency, buy, sell))
                except Exception as e:
                    logger.debug(f"[{bank_name}] Failed to parse row {row}: {e}")
                    
        return rates

    def _format_record(self, bank: str, currency: str, buy: float, sell: float) -> Dict[str, Any]:
        """Formats the data dictionary for Supabase Upsert."""
        now = datetime.now(timezone.utc)
        return {
            "bank_name": bank,
            "base_currency": "SAR",
            "target_currency": currency,
            "buy_rate": buy,
            "sell_rate": sell,
            "transfer_type": "International Remittance",
            "timestamp": now.isoformat(),
            "date_key": now.strftime("%Y-%m-%d")
        }

    async def _scrape_bank(self, page: Page, config: BankScraperConfig) -> List[Dict[str, Any]]:
        """Scrapes a specific bank using an async Playwright instance."""
        logger.info(f"[{config.name}] Starting extraction from {config.url}")
        rates = []
        try:
            # 1. Navigate with timeout and wait for network idle to ensure JavaScript renders
            response = await page.goto(config.url, timeout=45000, wait_until="networkidle")
            if not response or not response.ok:
                logger.error(f"[{config.name}] Failed to load page. HTTP Status: {response.status if response else 'Unknown'}")
                return rates

            # 2. Wait for common dynamic table elements (Timeout handled gracefully)
            try:
                await page.wait_for_selector("table", timeout=10000)
            except Exception:
                logger.warning(f"[{config.name}] Table did not render within timeout. Attempting fallback DOM extraction...")

            # 3. Extract raw HTML for BeautifulSoup processing
            html = await page.content()
            rates = await self._extract_with_bs4(html, config.name)
            
            if not rates:
                logger.warning(f"[{config.name}] Parsing yielded 0 results. DOM selectors likely require adjustment for this institution.")
            else:
                logger.info(f"[{config.name}] Successfully extracted {len(rates)} currency pairs.")

        except Exception as e:
            logger.error(f"[{config.name}] Critical error during scraping lifecycle: {str(e)}", exc_info=True)
            
        return rates

    async def run(self):
        """Main execution pipeline to orchestrate scraping and database sync."""
        all_rates = []
        
        logger.info("Initializing Playwright Engine...")
        async with async_playwright() as p:
            # Use Chromium headless with specific arguments to bypass WAFs
            browser = await p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled"]
            )
            context: BrowserContext = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1920, "height": 1080}
            )
            
            for config in self.banks:
                page = await context.new_page()
                
                bank_rates = await self._scrape_bank(page, config)
                if bank_rates:
                    all_rates.extend(bank_rates)
                    
                await page.close()
                # Polite scraping delay between requests to avoid rate limits
                await asyncio.sleep(2)
                
            await browser.close()

        # Execute Data Pipeline
        if all_rates:
            self._upsert_to_supabase(all_rates)
        else:
            logger.warning("Pipeline completed with 0 total records. Database sync skipped.")

    def _upsert_to_supabase(self, data: List[Dict[str, Any]]):
        """Atomic upsert of FX data into the Supabase Cloud SQL Database."""
        logger.info(f"Attempting atomic upsert of {len(data)} records to Supabase...")
        try:
            # The 'on_conflict' constraint ensures safe daily updates without duplication
            response = self.supabase.table('saudi_fx_rates').upsert(
                data, 
                on_conflict='bank_name,target_currency,date_key'
            ).execute()
            
            logger.info(f"✅ Successfully synchronized {len(response.data)} FX records to the cloud ledger.")
        except Exception as e:
            logger.error(f"❌ Database Synchronization Failed: {str(e)}", exc_info=True)

if __name__ == "__main__":
    scraper = SaudiFXScraper()
    asyncio.run(scraper.run())
