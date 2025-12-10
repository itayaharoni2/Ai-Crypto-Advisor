import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";

// this is the main component of this file
export default function Signup() {
  const navigate = useNavigate();
  // state for the inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // state for errors
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  // function that runs when the form is submitted
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    // email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    }

    // password validation
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // confirm password validation
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // if there are errors - save and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // if no errors - clear and continue
    setErrors({});
    setGeneralError("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        auth: false,
        body: { name, email, password },
      });

      const data = await res.json();

      if (!res.ok) {
        setGeneralError(data.message || "Signup failed");
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.name) {
        localStorage.setItem("userName", data.name);
      }

      navigate("/onboarding");
    } catch (err) {
      console.error("Signup error:", err);
      setGeneralError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  // what the component prints on the screen
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Sign Up</h1>
      {generalError && <p style={styles.error}>{generalError}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />
        {errors.name && <p style={styles.error}>{errors.name}</p>}
        {/* email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        {errors.email && <p style={styles.error}>{errors.email}</p>}

        {/* password */}
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        {errors.password && <p style={styles.error}>{errors.password}</p>}

        {/* confirm password */}
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={styles.input}
        />
        {errors.confirmPassword && (
          <p style={styles.error}>{errors.confirmPassword}</p>
        )}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
      <p style={styles.linkText}>
        Already have an account?{" "}
        <Link to="/login" style={styles.link}>
          Login
        </Link>
      </p>
    </div>
  );
}

// same styles pattern as Login
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
    marginTop: "8px",
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
