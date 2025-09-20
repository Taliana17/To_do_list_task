# To-do List Task

## 📌 Descripción
Aplicación de tareas (to-do) con autenticación simple en cliente, paginación, búsqueda, edición inline, animaciones y notificaciones.  
El backend es un **mock API** con `json-server`; el frontend está hecho con **React + Vite** y estilos con **Tailwind v4**.

## 🚀 Demo local rápida
```bash
# 1) Instalar dependencias
npm install

# 2) Levantar el mock de API (puerto 3001)
npm run server

# 3) En otra terminal, levantar el frontend (puerto 5173 por defecto)
npm run dev
```

### Credenciales de prueba
En `db.json` hay usuarios precargados:
- Daniela / `dani`
- Taliana / `taly`

> El login busca en `/users?username=&password=` y guarda el usuario en `localStorage`.

## 🗃️ Scripts disponibles
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "server": "json-server --watch db.json --port 3001"
}
```

## 🧩 Tech stack
- **Frontend**: React 19, Vite 7, Tailwind CSS v4, Framer Motion, Heroicons/Lucide, React-Toastify.
- **Backend (mock)**: json-server (CRUD sobre `db.json`).
- **Lint/format**: ESLint 9 + Prettier.

## 📁 Estructura relevante
```
To_do_list_task/
├─ db.json                  # Datos de usuarios y tareas (json-server)
├─ index.html
├─ package.json
├─ src/
│  ├─ App.jsx               # App principal (estado, fetching, paginación, UI)
│  ├─ main.jsx              # Bootstrap React
│  ├─ index.css             # Tailwind v4
│  ├─ auth/
│  │  └─ Login.jsx          # Login simple con json-server
│  └─ components/
│     ├─ TaskCard.jsx       # Tarjeta de tarea (vista/edición inline)
│     ├─ TaskActions.jsx    # Botones: editar, completar, eliminar
│     └─ TaskEdit.jsx       # Metadatos (autor, editado por, fecha)
```

## 🔌 API (json-server)
Base URL: `http://localhost:3001`

### Recursos
- **Usuarios**: `/users`
- **Tareas**: `/tasks`

### Modelo de tarea
```json
{
  "id": "string",
  "title": "string",
  "completed": false,
  "authorId": "string",
  "authorName": "string",
  "editedBy": "string|null",
  "updatedAt": "ISODateString"
}
```

### Endpoints típicos
```http
GET    /tasks
POST   /tasks
PATCH  /tasks/:id
DELETE /tasks/:id
GET    /users?username=:u&password=:p
```

## 🔍 Funcionalidades
- Login cliente (persistencia en `localStorage`).
- Crear/editar (inline)/completar/eliminar tareas.
- Búsqueda por título/autor (normalizada sin acentos).
- Paginación (9 por página) con “...” inteligente.
- Contadores de pendientes vs. hechas.
- Animaciones sutiles (Framer Motion).
- Notificaciones (React-Toastify).
- Selector de **tema de fondo** (gradiente) persistido (`localStorage`).
- Control de permisos de borrado: solo el autor puede eliminar.

## 🎨 Estilos
- Tailwind v4 (import directo en `index.css`).
- Gradientes suaves de fondo; tema guardado como `bgTheme`.

## 🔐 Autenticación
- **No hay JWT** ni sesiones de servidor; es solo mock:
  - `Login.jsx` consulta `/users?username=&password=`.
  - Si hay match, guarda `{id, username, name}` en `localStorage` (`"user"`).
  - `App.jsx` usa `user.id`/`user.name` para autoría y permisos.

## ⚙️ Requisitos
- Node.js 18+ recomendado.
- Puertos usados: `5173` (Vite), `3001` (json-server).

## 🧪 Lint
```bash
npm run lint
```

## 📦 Build
```bash
npm run build
npm run preview
```
