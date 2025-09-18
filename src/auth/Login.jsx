import { useState } from "react";

const BASE = "http://localhost:3001";

export default function Login({ onSuccess }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const url = `${BASE}/users?username=${encodeURIComponent(form.username)}&password=${encodeURIComponent(form.password)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("login fetch");
      const users = await res.json();
      if (users.length !== 1) throw new Error("invalid");
      const u = users[0];
      localStorage.setItem("user", JSON.stringify(u));
      onSuccess?.(u);
    } catch {
      setError("Usuario o contraseña inválidos");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6" style={{ backgroundColor: "#E9D5FF" }}>
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-7 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-purple-800">Iniciar sesión</h1>

        <label className="block text-sm mb-1">Usuario</label>
        <input
          className="w-full mb-3 border rounded px-3 py-2"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          autoComplete="username"
        />

        <label className="block text-sm mb-1">Contraseña</label>
        <input
          type="password"
          className="w-full mb-3 border rounded px-3 py-2"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          autoComplete="current-password"
        />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button className="w-full bg-purple-600 text-white py-2 rounded-xl hover:bg-purple-700 transition">
          Entrar
        </button>
      </form>
    </div>
  );
}
