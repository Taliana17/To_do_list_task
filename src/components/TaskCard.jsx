import { useState } from "react";
import TaskMeta from "./TaskActions";
import TaskActions from "./TaskEdit";

export default function TaskCard({ task, canDelete, onToggle, onDelete, onSave }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);

  function submitEdit(e) {
    e?.preventDefault();
    const newTitle = title.trim();
    if (newTitle && newTitle !== task.title) onSave(task.id, newTitle);
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
    setTitle(task.title);
  }

  return (
    <div className="rounded-2xl border bg-white/95 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition">
      {/* Título + estado */}
      <div className="flex items-start justify-between gap-3">
        {editing ? (
          <form onSubmit={submitEdit} className="flex-1">
            <input
              className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </form>
        ) : (
          <h3 className={`text-lg font-semibold ${task.completed ? "line-through text-gray-500" : ""}`}>
            {task.title}
          </h3>
        )}

        <span
          className={`text-xs rounded-full px-2 py-1 border ${
            task.completed
              ? "bg-green-100 text-green-800 border-green-200"
              : "bg-amber-100 text-amber-800 border-amber-200"
          }`}
        >
          {task.completed ? "Hecha" : "Pendiente"}
        </span>
      </div>

      {/* Metadatos */}
      <TaskMeta task={task} />

      {/* Acciones */}
      <TaskActions
        task={task}
        canDelete={canDelete}
        editing={editing}
        setEditing={setEditing}
        onToggle={onToggle}
        onDelete={onDelete}
        onSubmitEdit={submitEdit}
        onCancelEdit={cancelEdit}
      />
    </div>
  );
}
