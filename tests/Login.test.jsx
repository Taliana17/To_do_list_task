import { describe, test, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "./test-utils";
import React from "react";
import Login from "../src/auth/Login";
import { Routes, Route } from "react-router-dom";

const BASE = "http://localhost:3001";

function mockFetchOnce(data, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: async () => data,
  });
}

describe("Login", () => {
  test("login exitoso guarda usuario y navega a /app", async () => {
    const fakeUser = { id: "u1", username: "dani", name: "Daniela" };
    mockFetchOnce([fakeUser]);

    const routes = (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<div>App privada</div>} />
      </Routes>
    );

    renderWithProviders(<Login />, { initialEntries: ["/login"], routes });

    fireEvent.change(screen.getByLabelText(/username-input/i), { target: { value: "dani" } });
    fireEvent.change(screen.getByLabelText(/password-input/i), { target: { value: "123" } });
    fireEvent.click(screen.getByLabelText(/login-submit/i));

    await waitFor(() => expect(localStorage.getItem("user")).toContain('"username":"dani"'));
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/users?username=dani&password=123`);
    // al navegar debería renderizar la ruta /app
    expect(await screen.findByText(/app privada/i)).toBeInTheDocument();
  });

  test("login fallido no navega ni guarda usuario", async () => {
    mockFetchOnce([]); // sin usuarios

    const routes = (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<div>App privada</div>} />
      </Routes>
    );

    renderWithProviders(<Login />, { initialEntries: ["/login"], routes });

    fireEvent.change(screen.getByLabelText(/username-input/i), { target: { value: "bad" } });
    fireEvent.change(screen.getByLabelText(/password-input/i), { target: { value: "bad" } });
    fireEvent.click(screen.getByLabelText(/login-submit/i));

    // esperamos un poco a que termine
    await waitFor(() => {
      expect(localStorage.getItem("user")).toBeNull();
    });
    // y NO debería verse la app privada
    expect(screen.queryByText(/app privada/i)).not.toBeInTheDocument();
  });
});
