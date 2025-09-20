import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Login from "./auth/Login";
import TaskCard from "./components/TaskCard";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  SunIcon,
  MoonIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const BASE = "http://localhost:3001";
const PAGE_SIZE = 9;

// Paleta suave (gradientes coherentes)
const THEMES = {
  purple: { bg: "linear-gradient(135deg,#F7F2FF 0%,#EBDDFE 45%,#EAF4FF 100%)" },
  pink:   { bg: "linear-gradient(135deg,#FFF5FA 0%,#FDE8F3 45%,#F6ECFF 100%)" },
};

function norm(s = "") {
  return String(s).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  });

  const [theme, setTheme] = useState(() => localStorage.getItem("bgTheme") || "purple");
  useEffect(() => {
    document.body.style.transition = "background 600ms ease";
    document.body.style.background = THEMES[theme].bg;
    localStorage.setItem("bgTheme", theme);
  }, [theme]);

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ pending: 0, done: 0 });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
  const userId = user?.id ?? -1;
  const mine = useMemo(
    () => new Set(tasks.filter((t) => t.authorId === userId).map((t) => t.id)),
    [tasks, userId]
  );

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/tasks`);
      if (!res.ok) throw new Error("fetch tasks");
      let all = await res.json();
      all = Array.isArray(all) ? all : [];
      all.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

      const nq = norm(q);
      const filtered = nq
        ? all.filter((t) => norm(t.title).includes(nq) || norm(t.authorName).includes(nq))
        : all;

      setStats({
        pending: filtered.filter((t) => !t.completed).length,
        done: filtered.filter((t) => t.completed).length,
      });

      setTotal(filtered.length);
      const start = (page - 1) * PAGE_SIZE;
      setTasks(filtered.slice(start, start + PAGE_SIZE));
    } catch {
      toast.error("No se pudieron cargar las tareas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [page, user]);
  useEffect(() => {
    if (!user) return;
    const id = setTimeout(() => { if (page !== 1) setPage(1); else load(); }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line
  }, [q, user]);

  if (!user) {
    return (
      <>
        <Login
          onSuccess={async (u) => {
            setBooting(true);
            setUser(u);
            try { await load(); } finally { setBooting(false); }
          }}
        />
        <ToastContainer position="top-right" theme="light" />
      </>
    );
  }

  // CRUD
  async function addTask(e) {
    e.preventDefault();
    const t = title.trim(); if (!t) return;
    try {
      await fetch(`${BASE}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          completed: false,
          authorId: user.id,
          authorName: user.name,
          editedBy: null,
          updatedAt: new Date().toISOString(),
        }),
      });
      setTitle("");
      toast.success("Tarea creada ✨");
      if (page !== 1) setPage(1); else load();
    } catch { toast.error("No se pudo crear la tarea"); }
  }

  async function toggleTask(task) {
    try {
      await fetch(`${BASE}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: !task.completed,
          editedBy: user.name,
          updatedAt: new Date().toISOString(),
        }),
      });
      toast.success(task.completed ? "Tarea marcada pendiente ⏳" : "Tarea completada ✅");
      load();
    } catch { toast.error("No se pudo actualizar la tarea"); }
  }

  async function saveTitle(id, newTitle) {
    try {
      await fetch(`${BASE}/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          editedBy: user.name,
          updatedAt: new Date().toISOString(),
        }),
      });
      toast.info("Tarea editada ✏️"); load();
    } catch { toast.error("No se pudo editar la tarea"); }
  }

  async function removeTask(id) {
    try {
      await fetch(`${BASE}/tasks/${id}`, { method: "DELETE" });
      toast.success("Tarea eliminada 🗑️");
      if (tasks.length === 1 && page > 1) setPage((p) => Math.max(1, p - 1));
      else load();
    } catch { toast.error("No se pudo eliminar la tarea"); }
  }

  function logout() {
    localStorage.removeItem("user");
    setUser(null);
  }

  // UI
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header compacto */}
        <motion.header
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl bg-white/80 backdrop-blur ring-1 ring-black/5 px-3 py-2 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            {/* Izquierda: icono + título + stats (desktop) */}
            <div className="flex items-center gap-3">
              {/* LOGO con el mismo gradiente que “Añadir”, un tris más claro */}
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow ring-1 ring-white/10">
                <SparklesIcon className="h-4 w-4 opacity-95" />
              </div>
              <h1 className="text-lg font-semibold">Tareas</h1>

              <div className="hidden sm:flex items-center gap-2 ml-2">
                <div className="rounded-lg bg-violet-200 px-2.5 py-1 text-xs text-violet-900">
                  Pendientes: <strong>{stats.pending}</strong>
                </div>
                <div className="rounded-lg bg-emerald-200 px-2.5 py-1 text-xs text-emerald-900">
                  Hechas: <strong>{stats.done}</strong>
                </div>
              </div>
            </div>

            {/* Derecha: controles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme((t) => (t === "purple" ? "pink" : "purple"))}
                className="rounded-lg bg-white/70 px-2.5 py-1 ring-1 ring-black/10 shadow hover:bg-white"
                title="Cambiar tema"
              >
                {theme === "purple"
                  ? <SunIcon className="h-4 w-4 text-indigo-700" />
                  : <MoonIcon className="h-4 w-4 text-fuchsia-700" />}
              </button>
              <span className="text-sm text-gray-700">Hola, {user.name}</span>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1 rounded-lg bg-white/70 px-2.5 py-1 ring-1 ring-black/10 shadow hover:bg-white"
                title="Salir"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span className="text-sm">Salir</span>
              </button>
            </div>

            {/* Stats en mobile */}
            <div className="sm:hidden flex items-center gap-2">
              <div className="rounded-lg bg-violet-200 px-2.5 py-1 text-xs text-violet-900">
                Pendientes: <strong>{stats.pending}</strong>
              </div>
              <div className="rounded-lg bg-emerald-200 px-2.5 py-1 text-xs text-emerald-900">
                Hechas: <strong>{stats.done}</strong>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Buscar + Crear */}
        <div className="mb-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </span>
            <input
              className="w-full rounded-xl border bg-white/80 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="Buscar…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <form onSubmit={addTask} className="flex flex-1 gap-2">
            <input
              className="flex-1 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="Nueva tarea…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {/* Botón “Añadir” con el MISMO gradiente que el logo */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium shadow-sm bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:brightness-105"
            >
              <PlusIcon className="h-5 w-5" /> Añadir
            </motion.button>
          </form>
        </div>

        {/* Contenido */}
        {booting ? (
          <Panel>Cargando tareas…</Panel>
        ) : loading ? (
          <SkeletonGrid />
        ) : tasks.length === 0 ? (
          <EmptyState query={q} />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {tasks.map((t) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <TaskCard
                      task={t}
                      canDelete={mine.has(t.id)} // editar cualquiera; borrar solo propias
                      onToggle={toggleTask}
                      onDelete={removeTask}
                      onSave={saveTitle}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <ToastContainer position="top-right" theme="light" />
    </div>
  );
}

function Panel({ children }) {
  return <div className="p-10 text-center text-gray-600 bg-white/80 rounded-2xl border">{children}</div>;
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 rounded-2xl border bg-white/60 shadow-sm animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-10 text-center rounded-2xl bg-white/80 border"
    >
      <SparklesIcon className="mx-auto mb-2 h-8 w-8 text-purple-600" />
      {query ? (
        <p className="text-gray-600">No hay resultados para <strong>{query}</strong></p>
      ) : (
        <p className="text-gray-600">Sin tareas por ahora. ¡Crea la primera!</p>
      )}
    </motion.div>
  );
}

/* ---------- Paginación ---------- */
function Pagination({ page, totalPages, onChange }) {
  const pages = getPageItems(page, totalPages);
  return (
    <nav className="mt-6 flex items-center justify-center gap-1">
      <motion.button whileTap={{ scale: 0.96 }}
        onClick={() => onChange(Math.max(1, page - 1))}
        className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:opacity-50"
        disabled={page === 1}>
        ‹ Anterior
      </motion.button>

      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`dots-${idx}`} className="px-2">…</span>
        ) : (
          <motion.button whileTap={{ scale: 0.96 }}
            key={p}
            onClick={() => onChange(p)}
            className={`px-3 py-1 rounded-lg ${
              p === page ? "bg-purple-300 font-bold" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {p}
          </motion.button>
        )
      )}

      <motion.button whileTap={{ scale: 0.96 }}
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:opacity-50"
        disabled={page === totalPages}>
        Siguiente ›
      </motion.button>
    </nav>
  );
}

function getPageItems(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
  if (page >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "…", page - 1, page, page + 1, "…", totalPages];
}
