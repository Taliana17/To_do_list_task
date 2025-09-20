// tests/App.test.jsx
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import App from "../src/App";

const BASE = "http://localhost:3001";

/** Mock de fetch encadenado (GET/POST/PATCH/DELETE en orden) */
function chainFetch(steps) {
  global.fetch = vi.fn(async (url, opts = {}) => {
    const step = steps.shift();
    if (!step) throw new Error(`fetch inesperado: ${url}`);

    if (step.url && url !== step.url) {
      throw new Error(`URL esperada ${step.url} pero recibida ${url}`);
    }
    const method = opts.method || "GET";
    if (step.method && method !== step.method) {
      throw new Error(`Método esperado ${step.method} pero recibido ${method}`);
    }

    let body = step.body;
    if (typeof body === "function") body = await body(url, opts);

    return {
      ok: true,
      json: async () => body,
    };
  });
}

describe("App (CRUD tareas)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("agregar tarea: POST y aparece en la lista", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ id: "u1", username: "dani", name: "Daniela" })
    );

    const nueva = {
      id: "t1",
      title: "Primera tarea",
      completed: false,
      authorId: "u1",
      authorName: "Daniela",
      updatedAt: new Date().toISOString(),
    };

    chainFetch([
      // GET inicial vacío
      { url: `${BASE}/tasks`, method: "GET", body: [] },
      // POST crear
      {
        url: `${BASE}/tasks`,
        method: "POST",
        body: async (_, opts) => {
          const sent = JSON.parse(opts.body);
          expect(sent.title).toBe("Primera tarea");
          return nueva;
        },
      },
      // GET actualizado con la nueva
      { url: `${BASE}/tasks`, method: "GET", body: [nueva] },
    ]);

    render(<App />);

    const input = await screen.findByLabelText(/add-task-input/i);
    fireEvent.change(input, { target: { value: "Primera tarea" } });
    fireEvent.click(screen.getByLabelText(/add-task-submit/i));

    expect(await screen.findByText(/primera tarea/i)).toBeInTheDocument();
  });

  test("eliminar tarea: DELETE y desaparece de la lista", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ id: "u1", username: "dani", name: "Daniela" })
    );

    const tarea = {
      id: "t1",
      title: "Borrar esta",
      completed: false,
      authorId: "u1",
      authorName: "Daniela",
      updatedAt: new Date().toISOString(),
    };

    chainFetch([
      // GET inicial con 1 tarea
      { url: `${BASE}/tasks`, method: "GET", body: [tarea] },
      // DELETE
      { url: `${BASE}/tasks/t1`, method: "DELETE", body: {} },
      // GET actualizado vacío
      { url: `${BASE}/tasks`, method: "GET", body: [] },
    ]);

    render(<App />);

    expect(await screen.findByText(/borrar esta/i)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/task-delete/i));

    expect(
      await screen.findByText(/sin tareas por ahora/i)
    ).toBeInTheDocument();
  });

  test("editar/guardar título: PATCH y se ve el nuevo texto", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ id: "u1", username: "dani", name: "Daniela" })
    );

    const initialTasks = [
      {
        id: "t1",
        title: "Titulo viejo",
        completed: false,
        authorId: "u1",
        authorName: "Daniela",
        editedBy: null,
        updatedAt: new Date().toISOString(),
      },
    ];

    const updated = {
      ...initialTasks[0],
      title: "Titulo nuevo",
      editedBy: "Daniela",
      updatedAt: new Date().toISOString(),
    };

    chainFetch([
      // GET inicial
      { url: `${BASE}/tasks`, method: "GET", body: initialTasks },
      // PATCH (validamos payload)
      {
        url: `${BASE}/tasks/t1`,
        method: "PATCH",
        body: async (_, opts) => {
          const sent = JSON.parse(opts.body);
          expect(sent.title).toBe("Titulo nuevo");
          return updated;
        },
      },
      // GET actualizado con el nuevo título
      { url: `${BASE}/tasks`, method: "GET", body: [updated] },
    ]);

    render(<App />);

    // Ver el título viejo y entrar a edición
    expect(await screen.findByText(/titulo viejo/i)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/task-edit/i));

    // Cambiar el input y guardar
    const input = screen.getByDisplayValue(/titulo viejo/i);
    fireEvent.change(input, { target: { value: "Titulo nuevo" } });
    fireEvent.click(screen.getByLabelText(/task-save/i));

    // ✅ Espera al nuevo texto (evita falsos negativos por timing)
    expect(await screen.findByText(/titulo nuevo/i)).toBeInTheDocument();

    // (Opcional) Asegura que el viejo ya no está
    // expect(screen.queryByText(/titulo viejo/i)).not.toBeInTheDocument();
  });

  test("buscar filtra tareas por título", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ id: "u1", username: "dani", name: "Daniela" })
    );

    const tareas = [
      {
        id: "t1",
        title: "Comprar pan",
        completed: false,
        authorId: "u1",
        authorName: "Daniela",
      },
      {
        id: "t2",
        title: "Estudiar React",
        completed: false,
        authorId: "u1",
        authorName: "Daniela",
      },
    ];

    chainFetch([
      // GET inicial (ambas)
      { url: `${BASE}/tasks`, method: "GET", body: tareas },
      // GET tras escribir en el buscador (filtrado)
      { url: `${BASE}/tasks`, method: "GET", body: [tareas[1]] },
    ]);

    render(<App />);

    // Al inicio, se ven ambas
    expect(await screen.findByText(/comprar pan/i)).toBeInTheDocument();
    expect(await screen.findByText(/estudiar react/i)).toBeInTheDocument();

    // Escribimos "react" (dispara debounce + refetch)
    fireEvent.change(screen.getByLabelText(/search-input/i), {
      target: { value: "react" },
    });

    // Espera a que "Comprar pan" desaparezca tras el refetch
    await waitForElementToBeRemoved(
      () => screen.queryByText(/comprar pan/i),
      { timeout: 2000 }
    );

    // Queda solo "Estudiar React"
    expect(await screen.findByText(/estudiar react/i)).toBeInTheDocument();
  });
});
