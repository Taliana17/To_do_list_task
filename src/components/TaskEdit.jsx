export default function TaskMeta({ task }) {
  return (
    <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
      <span>Por <strong>{task.authorName}</strong></span>
      {task.editedBy && <span>Editada por {task.editedBy}</span>}
      <span>{new Date(task.updatedAt).toLocaleString()}</span>
    </div>
  );
}