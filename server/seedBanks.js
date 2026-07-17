import { setupDatabase } from './db.js';

async function seedBanks() {
  const db = await setupDatabase();
  console.log("Database connected. Seeding Al Rajhi Bank...");

  try {
    await db.run(`
      INSERT INTO banks (
        short_name, official_name, country, swift_code, website, customer_service, email,
        brand_color, brand_text_color, card_color, logo_url, icon_url
      ) VALUES (
        'Al Rajhi Bank',
        'Al Rajhi Banking and Investment Corporation',
        'SA',
        'RJHI SA RI',
        'https://www.alrajhibank.com.sa/',
        '+966920003344',
        'contact@alrajhibank.com.sa',
        '#003c71',
        '#ffffff',
        'linear-gradient(135deg, #003c71 0%, #0056a3 100%)',
        'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/Al_Rajhi_Bank_Logo.svg/1200px-Al_Rajhi_Bank_Logo.svg.png',
        'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/Al_Rajhi_Bank_Logo.svg/1200px-Al_Rajhi_Bank_Logo.svg.png'
      )
    `);
    console.log("Successfully seeded Al Rajhi Bank!");
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      console.log("Al Rajhi Bank already exists in DB. Updating...");
      await db.run(`
        UPDATE banks SET 
          brand_color = '#003c71',
          brand_text_color = '#ffffff',
          card_color = 'linear-gradient(135deg, #003c71 0%, #0056a3 100%)',
          logo_url = 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/Al_Rajhi_Bank_Logo.svg/1200px-Al_Rajhi_Bank_Logo.svg.png'
        WHERE swift_code = 'RJHI SA RI'
      `);
      console.log("Updated successfully.");
    } else {
      console.error("Error seeding:", err);
    }
  }
}

seedBanks();
