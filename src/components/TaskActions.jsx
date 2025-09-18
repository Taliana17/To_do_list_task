import { CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";

export default function TaskActions({
  task,
  canDelete,
  editing,
  setEditing,
  onToggle,
  onDelete,
  onSubmitEdit,
  onCancelEdit,
}) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onToggle(task)}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium shadow-sm transition
          ${task.completed
            ? "bg-yellow-200 hover:bg-yellow-300 text-yellow-900"
            : "bg-blue-200 hover:bg-blue-300 text-blue-900"}`}
        title={task.completed ? "Desmarcar" : "Completar"}
      >
        {task.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
        {task.completed ? "Desmarcar" : "Completar"}
      </button>

      {!editing ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium shadow-sm bg-purple-200 hover:bg-purple-300 text-purple-900 transition"
          title="Editar"
        >
          <Pencil size={16} /> Editar
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={onSubmitEdit}
            className="rounded-xl px-3 py-1.5 text-sm font-medium shadow-sm bg-green-200 hover:bg-green-300 text-green-900 transition"
            title="Guardar cambios"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-xl px-3 py-1.5 text-sm font-medium shadow-sm bg-gray-200 hover:bg-gray-300 text-gray-900 transition"
            title="Cancelar edición"
          >
            Cancelar
          </button>
        </>
      )}

      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="ml-auto inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium shadow-sm bg-pink-200 hover:bg-pink-300 text-pink-900 transition"
          title="Eliminar"
        >
          <Trash2 size={16} /> Eliminar
        </button>
      )}
    </div>
  );
}
