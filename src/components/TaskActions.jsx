// src/components/TaskActions.jsx
import { motion } from "framer-motion";
import {
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function TaskActions({
  task,
  canDelete,          // true si es tu tarea
  editing,
  setEditing,
  onToggle,           // recibe el objeto task
  onDelete,
  onSubmitEdit,
  onCancelEdit,
}) {
  const tap = { scale: 0.95 };

  // Cuando NO estoy editando y NO puedo eliminar, quiero que los 2 botones ocupen toda la fila.
  const wideIdle = !editing && !canDelete;
  const wrap = editing && canDelete ? "flex-wrap" : "flex-nowrap";
  const commonBtn =
    "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium shadow-sm transition";
  const stretch = wideIdle ? "flex-1 basis-0 justify-center" : "";

  return (
    <div className={`mt-1 flex items-center gap-2 ${wrap}`}>
      {/* Completar / Desmarcar */}
      <motion.button
        type="button"
        whileTap={tap}
        onClick={() => onToggle(task)}
        className={`${commonBtn} ${stretch} ${
          task.completed
            ? "bg-yellow-200 hover:bg-yellow-300 text-yellow-900"
            : "bg-blue-200 hover:bg-blue-300 text-blue-900"
        }`}
        title={task.completed ? "Desmarcar" : "Completar"}
      >
        <CheckCircleIcon className="w-5 h-5" />
        {task.completed ? "Desmarcar" : "Completar"}
      </motion.button>

      {/* Editar (siempre disponible) */}
      {!editing ? (
        <motion.button
          type="button"
          whileTap={tap}
          onClick={() => setEditing(true)}
          className={`${commonBtn} ${stretch} bg-purple-200 hover:bg-purple-300 text-purple-900`}
          title="Editar"
        >
          <PencilSquareIcon className="w-5 h-5" />
          Editar
        </motion.button>
      ) : (
        <>
          <motion.button
            type="button"
            whileTap={tap}
            onClick={onSubmitEdit}
            className={`${commonBtn} bg-green-200 hover:bg-green-300 text-green-900`}
            title="Guardar cambios"
          >
            Guardar
          </motion.button>

          <motion.button
            type="button"
            whileTap={tap}
            onClick={onCancelEdit}
            className={`${commonBtn} bg-gray-200 hover:bg-gray-300 text-gray-900`}
            title="Cancelar edición"
          >
            <XMarkIcon className="w-5 h-5" />
            Cancelar
          </motion.button>
        </>
      )}

      {/* Eliminar: solo si puedes borrar; baja en edición */}
      {canDelete && (
        <motion.button
          type="button"
          whileTap={tap}
          onClick={() => onDelete(task.id)}
          className={`${editing ? "basis-full" : "ml-auto"} ${commonBtn} bg-pink-200 hover:bg-pink-300 text-pink-900`}
          title="Eliminar"
        >
          <TrashIcon className="w-5 h-5" />
          Eliminar
        </motion.button>
      )}
    </div>
  );
}
