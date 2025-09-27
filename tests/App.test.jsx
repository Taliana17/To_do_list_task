import { describe, test, expect, vi } from "vitest";
import {
  screen,
  fireEvent,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { renderWithProviders } from "./test-utils";
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
  test("agregar tarea: POST y aparece en la lista", async () => {
    // prepara sesión
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
      { url: `${BASE}/tasks`, method: "GET", body: [] }, // GET inicial
      {
        url: `${BASE}/tasks`,
        method: "POST",
        body: async (_, opts) => {
          const sent = JSON.parse(opts.body);
          expect(sent.title).toBe("Primera tarea");
          return nueva;
        },
      },
      { url: `${BASE}/tasks`, method: "GET", body: [nueva] }, // GET tras crear
    ]);

    renderWithProviders(<App />, { initialEntries: ["/app"] });

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
      { url: `${BASE}/tasks`, method: "GET", body: [tarea] }, // GET inicial
      { url: `${BASE}/tasks/t1`, method: "DELETE", body: {} }, // DELETE
      { url: `${BASE}/tasks`, method: "GET", body: [] }, // GET vacío
    ]);

    renderWithProviders(<App />, { initialEntries: ["/app"] });

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
      { url: `${BASE}/tasks`, method: "GET", body: initialTasks },
      {
        url: `${BASE}/tasks/t1`,
        method: "PATCH",
        body: async (_, opts) => {
          const sent = JSON.parse(opts.body);
          expect(sent.title).toBe("Titulo nuevo");
          return updated;
        },
      },
      { url: `${BASE}/tasks`, method: "GET", body: [updated] },
    ]);

    renderWithProviders(<App />, { initialEntries: ["/app"] });

    expect(await screen.findByText(/titulo viejo/i)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/task-edit/i));

    const input = screen.getByDisplayValue(/titulo viejo/i);
    fireEvent.change(input, { target: { value: "Titulo nuevo" } });
    fireEvent.click(screen.getByLabelText(/task-save/i));

    expect(await screen.findByText(/titulo nuevo/i)).toBeInTheDocument();
  });

  test("buscar filtra tareas por título", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ id: "u1", username: "dani", name: "Daniela" })
    );

    const tareas = [
      { id: "t1", title: "Comprar pan", completed: false, authorId: "u1", authorName: "Daniela" },
      { id: "t2", title: "Estudiar React", completed: false, authorId: "u1", authorName: "Daniela" },
    ];

    chainFetch([
      { url: `${BASE}/tasks`, method: "GET", body: tareas },        // GET inicial
      { url: `${BASE}/tasks`, method: "GET", body: [tareas[1]] },   // GET tras buscar
    ]);

    renderWithProviders(<App />, { initialEntries: ["/app"] });

    expect(await screen.findByText(/comprar pan/i)).toBeInTheDocument();
    expect(await screen.findByText(/estudiar react/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/search-input/i), {
      target: { value: "react" },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/comprar pan/i), { timeout: 2000 });

    expect(await screen.findByText(/estudiar react/i)).toBeInTheDocument();
  });
});
