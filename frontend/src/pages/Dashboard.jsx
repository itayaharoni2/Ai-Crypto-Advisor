import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";

// Dashboard pulling data from backend + voting
export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    news: [],
    prices: [],
    aiInsight: null,
    meme: null,
  });

  const token = localStorage.getItem("token");

  const loadDashboard = async () => {
    // if token is missing -> user not logged in -> redirect
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/dashboard");
      const json = await res.json();
      if (!res.ok) {
        if (json.requiresOnboarding) {
          navigate("/onboarding");
          return;
        }
        setError(json.message || "Failed to load dashboard");
        setLoading(false);
        return;
      }
      setData(json);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  // handles voting
  const handleVote = async (section, itemId, vote) => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await apiFetch("/api/vote", {
        method: "POST",
        body: { section, itemId, vote },
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.message || "Failed to record vote");
        return;
      }
      loadDashboard();
    } catch (err) {
      console.error("Vote error:", err);
      setError("Network error while voting");
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (!token) return null;

  // rendering the 4 sections
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <button style={styles.refreshButton} onClick={loadDashboard}>
            Refresh
          </button>
        </div>

        <h1 style={styles.title}>Daily Crypto Briefing</h1>
        <p style={styles.subtitle}>
          Personalized snapshot based on your preferences.
        </p>

        {error && <p style={styles.error}>{error}</p>}
        {loading && <p style={styles.muted}>Loading...</p>}

        {!loading && (
          <div style={styles.grid}>
            <div style={styles.box}>
              <h2 style={styles.boxTitle}>Market News</h2>
              {data.news.map((item) => (
                <div key={item.id} style={styles.listItem}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    {item.title}
                  </a>
                  <VoteButtons
                    votes={item.votes}
                    onUp={() => handleVote("news", item.id, "up")}
                    onDown={() => handleVote("news", item.id, "down")}
                  />
                </div>
              ))}
            </div>

            <div style={styles.box}>
              <h2 style={styles.boxTitle}>Coin Prices (USD)</h2>
              {data.prices.map((coin) => (
                <div key={coin.id} style={styles.listItem}>
                  <span>{coin.id}</span>
                  <span>${coin.price?.toLocaleString()}</span>
                  <VoteButtons
                    votes={coin.votes}
                    onUp={() => handleVote("prices", coin.id, "up")}
                    onDown={() => handleVote("prices", coin.id, "down")}
                  />
                </div>
              ))}
            </div>

            <div style={styles.box}>
              <h2 style={styles.boxTitle}>AI Insight of the Day</h2>
              <p style={styles.text}>{data.aiInsight?.text}</p>
              <VoteButtons
                votes={data.aiInsight?.votes}
                onUp={() => handleVote("ai_insight", data.aiInsight?.id, "up")}
                onDown={() =>
                  handleVote("ai_insight", data.aiInsight?.id, "down")
                }
              />
            </div>

            <div style={styles.box}>
              <h2 style={styles.boxTitle}>Fun Crypto Meme</h2>
              {data.meme?.imageUrl && (
                <img
                  src={data.meme.imageUrl}
                  alt={data.meme.title}
                  style={styles.meme}
                />
              )}
              <p style={styles.text}>{data.meme?.title}</p>
              <VoteButtons
                votes={data.meme?.votes}
                onUp={() => handleVote("meme", data.meme?.id, "up")}
                onDown={() => handleVote("meme", data.meme?.id, "down")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// the Like / Dislike buttons
function VoteButtons({ votes = { up: 0, down: 0 }, onUp, onDown }) {
  return (
    <div style={styles.voteRow}>
      <button style={styles.voteBtn} onClick={onUp}>
        Like {votes.up || 0}
      </button>
      <button style={styles.voteBtn} onClick={onDown}>
        Dislike {votes.down || 0}
      </button>
    </div>
  );
}

// inline style
const styles = {
  container: {
    width: "100%",
    minHeight: "calc(100vh - 80px)",
    background: "#000000",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    color: "white",
    padding: "40px 20px",
  },
  card: {
    maxWidth: "1200px",
    width: "100%",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
    borderRadius: "16px",
    padding: "32px 40px",
    boxShadow: "0 20px 60px rgba(212, 175, 55, 0.2)",
    border: "2px solid #d4af37",
    position: "relative",
    zIndex: 1,
  },
  headerRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "16px",
  },
  title: {
    fontSize: "32px",
    marginBottom: "12px",
    color: "#d4af37",
    textShadow: "0 0 15px rgba(212, 175, 55, 0.5)",
    letterSpacing: "1px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#cccccc",
    marginBottom: "32px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "24px",
  },
  box: {
    background: "rgba(10, 10, 10, 0.8)",
    borderRadius: "12px",
    padding: "20px",
    border: "2px solid #333333",
    transition: "all 0.3s ease",
  },
  boxTitle: {
    fontSize: "18px",
    marginBottom: "12px",
    color: "#d4af37",
    fontWeight: "600",
  },
  boxText: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#ffffff",
  },
  refreshButton: {
    background: "#d4af37",
    border: "2px solid #d4af37",
    color: "#000000",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    boxShadow: "0 4px 15px rgba(212, 175, 55, 0.4)",
    transition: "all 0.3s ease",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
    padding: "8px",
    borderRadius: "6px",
    background: "rgba(212, 175, 55, 0.05)",
  },
  link: {
    color: "#d4af37",
    textDecoration: "none",
    flex: 1,
    transition: "all 0.2s ease",
  },
  voteRow: {
    display: "flex",
    gap: "8px",
  },
  voteBtn: {
    background: "transparent",
    border: "2px solid #333333",
    color: "#ffffff",
    borderRadius: "6px",
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.2s ease",
  },
  meme: {
    maxWidth: "300px",
    width: "100%",
    height: "auto",
    borderRadius: "8px",
    marginBottom: "12px",
    border: "2px solid #333333",
    display: "block",
    margin: "0 auto 12px auto",
  },
  text: {
    color: "#cccccc",
    lineHeight: "1.6",
  },
  error: {
    color: "#ff4444",
    marginBottom: "12px",
    textAlign: "center",
  },
  muted: {
    color: "#666666",
    textAlign: "center",
  },
};
