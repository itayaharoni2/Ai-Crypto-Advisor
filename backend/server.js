// Main backend file
import mongoose from "mongoose"; // connects to MongoDB
import express from "express"; // creates the HTTP server
import cors from "cors"; // allows frontend to call backend
import dotenv from "dotenv"; // loads the .env variables
import bcrypt from "bcrypt"; // hashes passwords
import jwt from "jsonwebtoken"; // creates / varifies tokens
import User from "./models/User.js";
import Vote from "./models/Vote.js";
import { authMiddleware } from "./middleware/auth.js";

// Loads .env, creates the express app and sets the port
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// allow frontend to talk with backend
app.use(
  cors({
    origin: "*",
  })
);

// Allows backend to read req.body as JSON
app.use(express.json());

// check if server is working
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Manages Signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    // check if user already exists in MongoDB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // save user in MongoDB
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // creates the JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, name: newUser.name },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "1h" }
    );

    // return token + user to frontend
    return res.status(201).json({
      message: "User created successfully",
      userId: newUser._id,
      token,
      name: newUser.name,
      onboardingCompleted: false,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Manages Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // basic validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // find user in MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // compares password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // creates new JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "1h" }
    );

    // returns token + name + onboarding status
    return res.json({
      message: "Login successful",
      token,
      name: user.name,
      onboardingCompleted: user.onboardingCompleted || false,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// normalize coin ids for CoinGecko
const COINGECKO_IDS = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  ADA: "cardano",
};

// used when API calls fail / keys missing
const fallbackNews = [
  {
    id: "static-1",
    title: "Market update: BTC and ETH hold key levels",
    url: "https://example.com/news1",
  },
  {
    id: "static-2",
    title: "Layer 2 ecosystems keep growing",
    url: "https://example.com/news2",
  },
];

// example meme
const fallbackMeme = {
  id: "meme-1",
  title: "When you hold through the dip",
  imageUrl: "https://i.imgflip.com/30b1gx.jpg",
};

// different caches for different boxes
const cache = {
  newsPrices: null, // News and prices - update every 1 second
  newsPricesExpiresAt: 0,
  memeInsight: null, // Meme and AI insight - update every 1 hour
  memeInsightExpiresAt: 0,
};
const NEWS_PRICES_CACHE_TTL_MS = 1000; // 1 second
const MEME_INSIGHT_CACHE_TTL_MS = 3600000; // 1 hour

// Uses CryptoPanic API
async function fetchNews(cryptoAssets = []) {
  const token = process.env.CRYPTOPANIC_TOKEN;
  if (!token) {
    // Filter fallback news by user preferences
    if (cryptoAssets.length > 0) {
      const tickers = cryptoAssets
        .map((asset) => {
          const match = /\(([^)]+)\)/.exec(asset);
          return match?.[1]?.toUpperCase();
        })
        .filter(Boolean);
      return fallbackNews
        .filter((item) =>
          tickers.some((ticker) => item.title.toUpperCase().includes(ticker))
        )
        .slice(0, 5);
    }
    return fallbackNews;
  }

  try {
    const response = await fetch(
      `https://cryptopanic.com/api/v1/posts/?auth_token=${token}&public=true`
    );
    if (!response.ok) {
      console.error("News fetch status:", response.status);
      return fallbackNews;
    }
    const data = await response.json();
    if (!data?.results) return fallbackNews;

    let news = data.results.map((item) => ({
      id: item.id?.toString() || item.url,
      title: item.title,
      url: item.url,
    }));

    // Filter by user's crypto assets if provided
    if (cryptoAssets.length > 0) {
      const tickers = cryptoAssets
        .map((asset) => {
          const match = /\(([^)]+)\)/.exec(asset);
          return match?.[1]?.toUpperCase();
        })
        .filter(Boolean);

      const filtered = news.filter((item) =>
        tickers.some((ticker) => item.title.toUpperCase().includes(ticker))
      );

      // If we have filtered results, use them; otherwise show all
      if (filtered.length > 0) {
        return filtered.slice(0, 5);
      }
    }

    return news.slice(0, 5);
  } catch (err) {
    console.error("News fetch error:", err);
    return fallbackNews;
  }
}

// Uses CoinGecko API
async function fetchCoinPrices(assets) {
  const coinIds =
    assets
      .map((asset) => {
        if (!asset) return null;
        // match ticker inside parentheses
        const match = /\(([^)]+)\)/.exec(asset);
        const ticker = match?.[1]?.toUpperCase() || asset.toUpperCase();
        return COINGECKO_IDS[ticker];
      })
      .filter(Boolean) || [];

  const ids = coinIds.length ? coinIds.join(",") : "bitcoin,ethereum";

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
    );
    const data = await response.json();
    return Object.entries(data).map(([id, priceObj]) => ({
      id,
      price: priceObj.usd,
    }));
  } catch (err) {
    console.error("Price fetch error:", err);
    return [
      { id: "bitcoin", price: 0 },
      { id: "ethereum", price: 0 },
    ];
  }
}

// Uses HuggingFace API
async function fetchAiInsight(preferences) {
  const hfToken = process.env.HF_API_TOKEN;
  // if fails return static message
  if (!hfToken) {
    return {
      id: "ai-insight",
      text:
        preferences?.investorType === "Day Trader"
          ? "Volatility is elevated today; watch BTC and SOL for intraday momentum."
          : "Long-term signals remain neutral; consider DCA into majors while monitoring on-chain flows.",
    };
  }

  const prompt = `You are a concise crypto assistant. Provide one actionable, 2-sentence market insight tailored to this user.

Investor type: ${preferences?.investorType || "Unknown"}
Crypto interests: ${
    (preferences?.cryptoAssets || []).join(", ") || "General market"
  }
Content preference: ${(preferences?.contentTypes || []).join(", ") || "General"}

Insight:`;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 120,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("HF insight status:", response.status);
      throw new Error("HF request failed");
    }

    const data = await response.json();
    const text =
      Array.isArray(data) && data[0]?.generated_text
        ? data[0].generated_text
        : typeof data === "string"
        ? data
        : "Market remains mixed; consider gradual entries on majors while monitoring funding rates.";

    return { id: "ai-insight", text };
  } catch (err) {
    console.error("AI insight fetch error:", err);
    return {
      id: "ai-insight",
      text: "Market remains mixed; consider gradual entries on majors while monitoring funding rates.",
    };
  }
}

// Uses meme-api for reddit scraping (if it fails - base meme)
async function fetchMeme() {
  try {
    const response = await fetch("https://meme-api.com/gimme/cryptomemes");
    if (!response.ok) {
      console.error("Meme fetch status:", response.status);
      return fallbackMeme;
    }
    const data = await response.json();
    return {
      id: data.postLink || data.url || "meme",
      title: data.title || "Daily crypto meme",
      imageUrl: data.url,
    };
  } catch (err) {
    console.error("Meme fetch error:", err);
    return fallbackMeme;
  }
}

// attach Like/dislike count to item in dashboard
async function aggregateVotes(section, items) {
  const ids = items.map((item) => item.id);
  const votes = await Vote.aggregate([
    { $match: { section, itemId: { $in: ids } } },
    {
      $group: {
        _id: { itemId: "$itemId", vote: "$vote" },
        count: { $sum: 1 },
      },
    },
  ]);

  const lookup = {};
  votes.forEach((v) => {
    const itemId = v._id.itemId;
    const voteType = v._id.vote;
    if (!lookup[itemId]) lookup[itemId] = { up: 0, down: 0 };
    lookup[itemId][voteType] = v.count;
  });

  return items.map((item) => ({
    ...item,
    votes: lookup[item.id] || { up: 0, down: 0 },
  }));
}

// Check user onboarding status
app.get("/api/user/status", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({
      onboardingCompleted: user.onboardingCompleted || false,
      hasPreferences: !!user.preferences?.cryptoAssets?.length,
    });
  } catch (err) {
    console.error("Status check error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Dashboard data - Core of the app
app.get("/api/dashboard", authMiddleware, async (req, res) => {
  // checks that user exists
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if onboarding is completed
    if (!user.onboardingCompleted) {
      return res.status(403).json({
        message: "Please complete onboarding first",
        requiresOnboarding: true,
      });
    }
    // loads users preferences
    const prefs = user.preferences || {};

    // fetches the important data
    const now = Date.now();
    let newsRaw, pricesRaw, aiInsightRaw, memeRaw;

    // Fetch news and prices (update every 1 second)
    if (cache.newsPrices && cache.newsPricesExpiresAt > now) {
      ({ newsRaw, pricesRaw } = cache.newsPrices);
    } else {
      [newsRaw, pricesRaw] = await Promise.all([
        fetchNews(prefs.cryptoAssets || []),
        fetchCoinPrices(prefs.cryptoAssets || []),
      ]);
      cache.newsPrices = { newsRaw, pricesRaw };
      cache.newsPricesExpiresAt = now + NEWS_PRICES_CACHE_TTL_MS;
    }

    // Fetch meme and AI insight (update every 1 hour)
    if (cache.memeInsight && cache.memeInsightExpiresAt > now) {
      ({ aiInsightRaw, memeRaw } = cache.memeInsight);
    } else {
      [aiInsightRaw, memeRaw] = await Promise.all([
        fetchAiInsight(prefs),
        fetchMeme(),
      ]);
      cache.memeInsight = { aiInsightRaw, memeRaw };
      cache.memeInsightExpiresAt = now + MEME_INSIGHT_CACHE_TTL_MS;
    }

    // attack vote count to items
    const news = await aggregateVotes("news", newsRaw);
    const prices = await aggregateVotes("prices", pricesRaw);
    const aiInsight = await aggregateVotes("ai_insight", [aiInsightRaw]);
    const meme = await aggregateVotes("meme", [memeRaw]);

    // returns everything to the frontend
    return res.json({
      news,
      prices,
      aiInsight: aiInsight[0],
      meme: meme[0],
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Voting endpoint
app.post("/api/vote", authMiddleware, async (req, res) => {
  try {
    const { section, itemId, vote } = req.body;
    if (!section || !itemId || !vote) {
      return res
        .status(400)
        .json({ message: "section, itemId and vote required" });
    }

    await Vote.findOneAndUpdate(
      { userId: req.user.userId, section, itemId },
      { vote },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ message: "Vote recorded" });
  } catch (err) {
    console.error("Vote error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// saves user preferences route
app.post("/api/user/preferences", authMiddleware, async (req, res) => {
  try {
    const { cryptoAssets, investorType, contentTypes } = req.body;

    const userId = req.user.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        preferences: {
          cryptoAssets: cryptoAssets || [],
          investorType: investorType || "",
          contentTypes: contentTypes || [],
        },
        onboardingCompleted: true,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "Preferences saved successfully" });
  } catch (err) {
    console.error("Save preferences error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// connects to DB and starts server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
