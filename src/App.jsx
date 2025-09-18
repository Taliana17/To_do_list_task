// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import Login from "./auth/Login";
import TaskCard from "./components/TaskCard";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Palette, Sparkles } from "lucide-react";

const BASE = "http://localhost:3001";
const PAGE_SIZE = 9;

// Colores pastel del fondo
const PURPLE = "#E9D5FF";
const PINK = "#FBCFE8";

export default function App() {
  // ---------- Usuario ----------
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  });

  // ---------- Fondo con toggle ----------
  const [theme, setTheme] = useState(() => localStorage.getItem("bgTheme") || "purple");
  useEffect(() => {
    document.body.style.transition = "background-color 700ms ease";
    document.body.style.backgroundColor = theme === "purple" ? PURPLE : PINK;
    localStorage.setItem("bgTheme", theme);
  }, [theme]);

  // ---------- Tareas / búsqueda / paginación ----------
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  // Permisos (puedes dejar canDelete=true si no usas esto)
  const userId = user?.id ?? -1;
  const mine = useMemo(
    () => new Set(tasks.filter((t) => t.authorId === userId).map((t) => t.id)),
    [tasks, userId]
  );

  // ====== Cargar tareas con paginación + búsqueda (solo frontend) ======
  async function load() {
    setLoading(true);
    try {
      // 1) Trae TODO (si hay q, se filtra en el server; si no, todo)
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());

      // SIN _page ni _limit — traemos la lista completa
      const res = await fetch(`${BASE}/tasks?${params.toString()}`);
      if (!res.ok) throw new Error("fetch tasks");
      let all = await res.json();

      // 2) Ordena por updatedAt desc (por si el backend no lo hace)
      all = (Array.isArray(all) ? all : []).sort((a, b) => {
        const da = new Date(a.updatedAt || 0).getTime();
        const db = new Date(b.updatedAt || 0).getTime();
        return db - da;
      });

      // 3) Total para calcular páginas
      const totalCount = all.length;
      setTotal(totalCount);

      // 4) Slice de la página actual (9 por página)
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      setTasks(all.slice(start, end));
    } catch (e) {
      console.error(e);
      toast.error("No se pudieron cargar las tareas");
    } finally {
      setLoading(false);
    }
  }

  // Cargar al cambiar página o cuando hay usuario
  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [page, user]);

  // Cargar al cambiar búsqueda (debounce) y volver a página 1
  useEffect(() => {
    if (!user) return;
    const id = setTimeout(() => {
      if (page !== 1) setPage(1);
      else load();
    }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line
  }, [q, user]);

  // ---------- Login ----------
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

  // ---------- Acciones CRUD ----------
  async function addTask(e) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
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
      // Nota: si hay filtro q, puede que no la veas si no coincide
      if (q.trim()) toast.info("Tienes un filtro activo. Borra el buscador para ver todas.");
      if (page !== 1) setPage(1); else load();
    } catch {
      toast.error("No se pudo crear la tarea");
    }
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
    } catch {
      toast.error("No se pudo actualizar la tarea");
    }
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
      toast.info("Tarea editada ✏️");
      load();
    } catch {
      toast.error("No se pudo editar la tarea");
    }
  }

  async function removeTask(id) {
    try {
      await fetch(`${BASE}/tasks/${id}`, { method: "DELETE" });
      toast.success("Tarea eliminada 🗑️");
      if (tasks.length === 1 && page > 1) setPage((p) => Math.max(1, p - 1));
      else load();
    } catch {
      toast.error("No se pudo eliminar la tarea");
    }
  }

  function logout() {
    localStorage.removeItem("user");
    setUser(null);
  }

  // ---------- UI ----------
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗒️</span>
            <h1 className="text-2xl font-bold">Tareas</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle de fondo */}
            <button
              onClick={() => setTheme((t) => (t === "purple" ? "pink" : "purple"))}
              className={`relative w-14 h-8 rounded-full flex items-center transition
                ${theme === "purple" ? "bg-purple-300" : "bg-pink-300"}`}
            >
              <span
                className={`absolute left-1 top-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform
                  ${theme === "purple" ? "translate-x-0" : "translate-x-6"}`}
              >
                {theme === "purple" ? (
                  <Palette size={16} className="text-purple-600" />
                ) : (
                  <Sparkles size={16} className="text-pink-500" />
                )}
              </span>
            </button>

            <span className="text-sm text-gray-700">Hola, {user.name}</span>
            <button
              onClick={logout}
              className="rounded-xl px-3 py-1 font-medium shadow-sm bg-gray-200 hover:bg-gray-300 text-gray-900 transition"
            >
              Salir
            </button>
          </div>
        </header>

        {/* Crear + Buscar */}
        <div className="mb-4 flex flex-col sm:flex-row gap-2">
          <form onSubmit={addTask} className="flex flex-1 gap-2">
            <input
              className="flex-1 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="Nueva tarea…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button className="rounded-xl px-4 py-2 font-medium shadow-sm bg-green-200 hover:bg-green-300 text-green-900 transition">
              + Añadir
            </button>
          </form>

          <input
            className="w-full sm:w-72 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="Buscar…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Contenido */}
        {booting ? (
          <Panel>Cargando tareas…</Panel>
        ) : loading ? (
          <Panel>Cargando…</Panel>
        ) : tasks.length === 0 ? (
          <Panel>{q ? <>No hay resultados para <strong>{q}</strong></> : "Sin tareas"}</Panel>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {tasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  canDelete={mine.has(t.id)}   // o true si no usas permisos
                  onToggle={toggleTask}
                  onDelete={removeTask}
                  onSave={saveTitle}
                />
              ))}
            </div>

            {/* Paginación — SIEMPRE visible (muestra 1, 2, 3 …) */}
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      {/* Toasts */}
      <ToastContainer position="top-right" theme="light" />
    </div>
  );
}

function Panel({ children }) {
  return (
    <div className="p-10 text-center text-gray-600 bg-white/80 rounded-2xl border">
      {children}
    </div>
  );
}

/* ---------- Paginación ---------- */
function Pagination({ page, totalPages, onChange }) {
  // Si prefieres ocultarla cuando solo hay 1 página, descomenta:
  // if (totalPages <= 1) return null;

  const pages = getPageItems(page, totalPages);

  return (
    <nav className="mt-6 flex items-center justify-center gap-1">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:opacity-50"
        disabled={page === 1}
      >
        ‹ Anterior
      </button>

      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`dots-${idx}`} className="px-2">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-3 py-1 rounded-lg ${
              p === page ? "bg-purple-300 font-bold" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:opacity-50"
        disabled={page === totalPages}
      >
        Siguiente ›
      </button>
    </nav>
  );
}

function getPageItems(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
  if (page >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "…", page - 1, page, page + 1, "…", totalPages];
}
