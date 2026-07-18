# Remitwise 💸

Remitwise is a full-stack remittance comparison and insights platform. It empowers users to find the best exchange rates across multiple money transfer operators, track historical trends, and make mathematically informed decisions about when to send money abroad.

## Features ✨

- **Live Rate Comparison**: Compare real-time foreign exchange buy/sell rates from providers like STC Pay, Western Union, Riyadh Bank, and more.
- **Smart Analytics & Trends**: Dynamically calculates day-over-day growth percentages based on KSA timezone logic to show whether currencies are trending up or down.
- **AI Calculator & Insights**: Input a historical transaction date, base currency, and amount. The system queries the database to compare your past rate against today's best live rate, calculating exact profit/loss.
- **Telegram Bot Integration**: Subscribes users to specific currency pairs and broadcasts live market pulses and alert notifications.
- **Supabase Cloud Database**: Robust data storage using PostgreSQL hosted on Supabase, connected seamlessly via a Node.js API backend.

## Tech Stack 🛠️

- **Frontend**: HTML5, CSS3, React.js (via CDN), TailwindCSS, Babel
- **Backend API**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Integrations**: Telegram Bot API (`node-telegram-bot-api`)

## Local Setup Instructions 🚀

### 1. Prerequisites
- Node.js (v18 or higher)
- A Supabase account and project
- A Telegram Bot Token (from BotFather)

### 2. Installation
Clone the repository and install the Node dependencies:
```bash
git clone https://github.com/YOUR_USERNAME/remitwise-app.git
cd remitwise-app
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add the following keys:
```env
PORT=3002
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### 4. Run the Development Server
Start the Express API server:
```bash
npm start
```
The application will be running at: `https://remitwise.fit/send_money.html`

## Production Deployment 🌐
This app is ready to be deployed on platforms like **Render.com** or **Railway.app**. 
Ensure the build command is set to `npm install` and the start command is `npm start`. All `.env` variables must be added to your hosting platform's dashboard.

---
*Built with ❤️ for smarter cross-border remittances.*
