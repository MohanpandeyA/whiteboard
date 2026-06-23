// src/pages/Register.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

const Register = () => {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(form.name, form.email, form.password);
    if (success) navigate("/dashboard");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <span style={styles.logoIcon}>✏️</span>
          <h1 style={styles.title}>Whiteboard</h1>
          <p style={styles.tagline}>Create your account</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Name</label>
          <input
            style={styles.input}
            type="text"
            name="name"
            placeholder="Your name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            name="password"
            placeholder="Min 8 chars, uppercase & symbol"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a0000 40%, #8b0000 100%)",
  },
  card: {
    background: "#111111",
    borderRadius: 16,
    padding: "40px 48px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(220,38,38,0.2)",
    border: "1px solid rgba(220,38,38,0.15)",
  },
  logoArea: { textAlign: "center", marginBottom: 28 },
  logoIcon: { fontSize: 36 },
  title: { fontSize: 28, margin: "8px 0 4px", color: "#ffffff", fontWeight: 800 },
  tagline: { fontSize: 13, color: "#9ca3af", margin: 0 },
  error: {
    background: "rgba(220,38,38,0.15)",
    color: "#f87171",
    padding: "10px 14px",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    border: "1px solid rgba(220,38,38,0.3)",
  },
  form: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: "#d1d5db" },
  input: {
    padding: "11px 14px",
    borderRadius: 8,
    border: "1.5px solid #374151",
    background: "#1f1f1f",
    color: "#ffffff",
    fontSize: 15,
    outline: "none",
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
    padding: "13px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.02em",
  },
  footer: { textAlign: "center", marginTop: 20, color: "#6b7280", fontSize: 14 },
  link: { color: "#ef4444", fontWeight: 600, textDecoration: "none" },
};

export default Register;
