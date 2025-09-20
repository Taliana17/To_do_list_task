import { useState } from "react";
import { motion } from "framer-motion";
import {
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

const BASE = "http://localhost:3001"; // json-server

export default function Login({ onSuccess }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const u = form.username.trim();
    const p = form.password.trim();
    if (!u || !p) return toast.error("Completa usuario y contraseña");
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE}/users?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`
      );
      if (!res.ok) throw new Error("fetch users");
      const users = await res.json();
      if (Array.isArray(users) && users.length) {
        const user = users[0];
        localStorage.setItem("user", JSON.stringify(user));
        onSuccess(user);
        toast.success(`Bienvenido, ${user.name}`);
      } else {
        toast.error("Usuario o contraseña incorrectos");
      }
    } catch {
      toast.error("No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      {/* Fondo animado con blobs suaves */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          style={{ background: "rgba(138, 92, 246, 0.22)" }} // violet-500 @ 18%
          className="absolute -left-24 top-10 h-80 w-80 rounded-full blur-3xl"
          animate={{ x: [-40, 30, -40], y: [0, -25, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{ background: "rgba(240, 127, 183, 0.17)" }} // pink-500 @ 16%
          className="absolute right-0 bottom-10 h-96 w-96 rounded-full blur-3xl"
          animate={{ x: [30, -15, 30], y: [20, -10, 20] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Card glass con glow sutil */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md rounded-3xl bg-white/90 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 p-7 relative"
      >
        <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-pink-500/10 blur-xl" />
        <div className="mb-6 flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-lg">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-purple-700 to-fuchsia-700 bg-clip-text text-transparent">
              Iniciar sesión
            </span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Usuario */}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <UserIcon className="h-5 w-5" />
            </span>
            <input
              aria-label="username-input"
              className="w-full rounded-2xl border border-gray-300 bg-white/80 px-10 py-3 outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-300/30"
              placeholder="Usuario"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
            />
          </div>

          {/* Contraseña */}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <LockClosedIcon className="h-5 w-5" />
            </span>
            <input
              aria-label="password-input"
              type={show ? "text" : "password"}
              className="w-full rounded-2xl border border-gray-300 bg-white/80 px-10 py-3 pr-12 outline-none transition focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-300/30"
              placeholder="Contraseña"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              title={show ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {show ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>

          {/* Botón */}
          <motion.button
            aria-label="login-submit"
            type="submit"
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="mt-2 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 font-semibold text-white shadow-lg shadow-fuchsia-300/30 transition hover:brightness-105 disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <ArrowPathIcon className="h-5 w-5 animate-spin" /> Entrando…
              </span>
            ) : (
              "Entrar"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
