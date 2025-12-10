# AI Crypto Advisor

Personalized crypto dashboard with onboarding, AI insights, market news, prices, memes, and voting. Built with React + Vite (frontend) and Express + MongoDB (backend). Auth via JWT, preferences stored per user, and content fetched from free public APIs.

## How it works

- Auth: Email, name, password with JWT. Login/signup return a token and user name.
- Onboarding: Collects crypto interests, investor type, and content preferences; stores in MongoDB.
- Dashboard: Shows market news (CryptoPanic), coin prices (CoinGecko), AI insight (Hugging Face Inference), and a crypto meme (meme-api). Users can like/dislike each item; votes are stored for future model improvements.
- Caching: News/prices refresh every 1s; meme/AI insight refresh hourly.
- UI: Black-and-gold theme, shared navbar with user menu and logout.
