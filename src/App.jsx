import { useEffect, useMemo, useState } from "react";
import Login from "./auth/Login";
import TaskCard from "./components/TaskCard";
import { listTasks, createTask, patchTask, deleteTask } from "./auth/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Palette, Sparkles } from "lucide-react";

// Colores pastel
const PURPLE = "#E9D5FF";
const PINK = "#FBCFE8";

export default function App() {
  // ---------- Usuario ----------
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  // ---------- Fondo con toggle ----------
  const [theme, setTheme] = useState(() => localStorage.getItem("bgTheme") || "purple");
  useEffect(() => {
    document.body.style.transition = "background-color 700ms ease";
    document.body.style.backgroundColor = theme === "purple" ? PURPLE : PINK;
    localStorage.setItem("bgTheme", theme);
  }, [theme]);

  // ---------- Tareas ----------
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(false);

  const userId = user?.id ?? -1;

  const mine = useMemo(
    () => new Set(tasks.filter((t) => t.authorId === userId).map((t) => t.id)),
    [tasks, userId]
  );

  async function load() {
    try {
      setLoading(true);
      const params = q ? { q } : { _sort: "updatedAt", _order: "desc" };
      const data = await listTasks(params);
      setTasks(data);
    } catch {
      toast.error("No se pudieron cargar las tareas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) load();
  }, [user, q]);

  // ---------- Login ----------
  if (!user) {
    return (
      <>
        <Login
          onSuccess={async (u) => {
            setBooting(true);
            setUser(u);
            try {
              await load();
            } finally {
              setBooting(false);
            }
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
      await createTask({
        title: t,
        completed: false,
        authorId: user.id,
        authorName: user.name,
        editedBy: null,
        updatedAt: new Date().toISOString(),
      });
      setTitle("");
      toast.success("Tarea creada ✨");
      load();
    } catch {
      toast.error("No se pudo crear la tarea");
    }
  }

  async function toggleTask(task) {
    try {
      await patchTask(task.id, {
        completed: !task.completed,
        editedBy: user.name,
        updatedAt: new Date().toISOString(),
      });
      toast.success(task.completed ? "Tarea marcada pendiente ⏳" : "Tarea completada ✅");
      load();
    } catch {
      toast.error("No se pudo actualizar la tarea");
    }
  }

  async function saveTitle(id, newTitle) {
    try {
      await patchTask(id, {
        title: newTitle,
        editedBy: user.name,
        updatedAt: new Date().toISOString(),
      });
      toast.info("Tarea editada ✏️");
      load();
    } catch {
      toast.error("No se pudo editar la tarea");
    }
  }

  async function removeTask(id) {
    try {
      await deleteTask(id);
      toast.success("Tarea eliminada 🗑️");
      load();
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
            <h1 className="text-2xl font-bold"> Tareas </h1>
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
          <div className="p-10 text-center text-gray-600 bg-white/80 rounded-2xl border">
            Cargando tareas…
          </div>
        ) : loading ? (
          <div className="p-10 text-center text-gray-600 bg-white/80 rounded-2xl border">
            Cargando…
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-10 text-center text-gray-600 bg-white/80 rounded-2xl border">
            Sin tareas
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                canDelete={mine.has(t.id)}
                onToggle={toggleTask}
                onDelete={removeTask}
                onSave={saveTitle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toasts */}
      <ToastContainer position="top-right" theme="light" />
    </div>
  );
}
