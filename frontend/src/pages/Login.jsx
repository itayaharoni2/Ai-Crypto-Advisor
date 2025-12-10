import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";

// Main componnet of the file
export default function Login() {
  const navigate = useNavigate();
  // state for the inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // state for errors
  const [errors, setErrors] = useState({});

  // 2. function that runs when the form is submitted
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        auth: false,
        body: { email, password },
      });

      const data = await res.json();

      // backend returned an error
      if (!res.ok) {
        setErrors((prev) => ({
          ...prev,
          general: data.message || "Login failed",
        }));
        return;
      }

      localStorage.setItem("token", data.token);
      if (data.name) {
        localStorage.setItem("userName", data.name);
      }

      // redirect based on onboarding status
      if (data.onboardingCompleted) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrors((prev) => ({
        ...prev,
        general: "Network error, please try again",
      }));
    }
  };

  // what the component prints on the screen
  return (
    // the style is down in "container" and "login"
    <div style={styles.container}>
      <h1 style={styles.title}>Login</h1>
      {errors.general && <p style={styles.error}>{errors.general}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* onChange - every character typed is updated, so we can be in control */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        {errors.email && <p style={styles.error}>{errors.email}</p>}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        {errors.password && <p style={styles.error}>{errors.password}</p>}

        <button type="submit" style={styles.button}>
          Sign In
        </button>
      </form>
      <p style={styles.linkText}>
        Don't have an account?{" "}
        <Link to="/signup" style={styles.link}>
          Sign up
        </Link>
      </p>
    </div>
  );
}

// inline styles
const styles = {
  container: {
    width: "100%",
    minHeight: "calc(100vh - 80px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#000000",
    padding: "40px 20px",
  },
  title: {
    marginBottom: "30px",
    fontSize: "36px",
    fontWeight: "bold",
    color: "#d4af37",
    textShadow: "0 0 20px rgba(212, 175, 55, 0.5)",
    letterSpacing: "2px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "400px",
    gap: "20px",
  },
  input: {
    padding: "14px 16px",
    fontSize: "16px",
    border: "2px solid #333333",
    borderRadius: "8px",
    background: "#0a0a0a",
    color: "#ffffff",
    transition: "all 0.3s ease",
  },
  button: {
    padding: "14px 24px",
    fontSize: "18px",
    background: "#d4af37",
    color: "#000000",
    border: "2px solid #d4af37",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px",
    boxShadow: "0 4px 15px rgba(212, 175, 55, 0.4)",
    transition: "all 0.3s ease",
  },
  error: {
    color: "#ff4444",
    fontSize: "14px",
    margin: 0,
    textAlign: "center",
  },
  linkText: {
    marginTop: "24px",
    fontSize: "16px",
    color: "#cccccc",
    fontWeight: "400",
  },
  link: {
    color: "#d4af37",
    textDecoration: "none",
    fontWeight: "bold",
    cursor: "pointer",
    textShadow: "0 0 10px rgba(212, 175, 55, 0.5)",
  },
};
