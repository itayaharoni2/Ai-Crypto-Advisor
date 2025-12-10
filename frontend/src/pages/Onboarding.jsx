import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";

const CRYPTO_OPTIONS = [
  "Bitcoin (BTC)",
  "Ethereum (ETH)",
  "Solana (SOL)",
  "Cardano (ADA)",
  "Other",
];
const INVESTOR_TYPES = [
  "HODLer",
  "Day Trader",
  "NFT Collector",
  "DeFi User",
  "Just Curious",
];
const CONTENT_OPTIONS = [
  "Market News",
  "Charts",
  "On-chain data",
  "Social Sentiment",
  "Fun & Memes",
];

export default function Onboarding() {
  const navigate = useNavigate();

  const [cryptoAssets, setCryptoAssets] = useState([]);
  const [investorType, setInvestorType] = useState("");
  const [contentTypes, setContentTypes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Check if user already completed onboarding
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await apiFetch("/api/user/status");
        const data = await res.json();
        if (data.onboardingCompleted) {
          navigate("/dashboard");
          return;
        }
      } catch (err) {
        console.error("Status check error:", err);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [navigate]);

  const toggleInArray = (value, list, setList) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // at least 1 crypto and 1 content, and investorType selected
    if (
      !investorType ||
      cryptoAssets.length === 0 ||
      contentTypes.length === 0
    ) {
      setError(
        "Please choose at least one crypto, one investor type, and one content type."
      );
      return;
    }

    try {
      const res = await apiFetch("/api/user/preferences", {
        method: "POST",
        body: {
          cryptoAssets,
          investorType,
          contentTypes,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to save preferences");
        return;
      }

      // success -> go to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Network error, please try again");
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.muted}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Tell us about your crypto style</h1>
        <p style={styles.subtitle}>
          We will use this to personalize your AI crypto advisor.
        </p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* crypto assets */}
          <div>
            <h2 style={styles.sectionTitle}>
              What crypto assets are you interested in?
            </h2>
            <div style={styles.chipsContainer}>
              {CRYPTO_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    toggleInArray(option, cryptoAssets, setCryptoAssets)
                  }
                  style={{
                    ...styles.chip,
                    ...(cryptoAssets.includes(option)
                      ? styles.chipSelected
                      : {}),
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* investor type */}
          <div>
            <h2 style={styles.sectionTitle}>What type of investor are you?</h2>
            <div style={styles.chipsContainer}>
              {INVESTOR_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInvestorType(type)}
                  style={{
                    ...styles.chip,
                    ...(investorType === type ? styles.chipSelected : {}),
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* content types */}
          <div>
            <h2 style={styles.sectionTitle}>
              What kind of content would you like to see?
            </h2>
            <div style={styles.chipsContainer}>
              {CONTENT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    toggleInArray(option, contentTypes, setContentTypes)
                  }
                  style={{
                    ...styles.chip,
                    ...(contentTypes.includes(option)
                      ? styles.chipSelected
                      : {}),
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" style={styles.submitButton}>
            Save and continue
          </button>
        </form>
      </div>
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
    alignItems: "center",
    padding: "40px 20px",
    color: "white",
  },
  card: {
    maxWidth: "900px",
    width: "100%",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
    borderRadius: "16px",
    padding: "32px 40px",
    boxShadow: "0 20px 60px rgba(212, 175, 55, 0.2)",
    border: "2px solid #d4af37",
    position: "relative",
    zIndex: 1,
  },
  title: {
    fontSize: "28px",
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
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  sectionTitle: {
    fontSize: "18px",
    marginBottom: "12px",
    color: "#d4af37",
    fontWeight: "600",
  },
  chipsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  chip: {
    padding: "10px 18px",
    borderRadius: "999px",
    border: "2px solid #333333",
    background: "transparent",
    color: "#ffffff",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  chipSelected: {
    background: "#d4af37",
    borderColor: "#d4af37",
    color: "#000000",
    boxShadow: "0 0 15px rgba(212, 175, 55, 0.5)",
    fontWeight: "bold",
  },
  submitButton: {
    marginTop: "16px",
    padding: "16px 32px",
    fontSize: "18px",
    background: "#d4af37",
    color: "#000000",
    border: "2px solid #d4af37",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px",
    boxShadow: "0 4px 20px rgba(212, 175, 55, 0.4)",
    transition: "all 0.3s ease",
  },
  error: {
    color: "#ff4444",
    fontSize: "14px",
    marginBottom: "12px",
    textAlign: "center",
  },
  muted: {
    color: "#666666",
    textAlign: "center",
  },
};
