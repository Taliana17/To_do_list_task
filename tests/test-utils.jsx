import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render } from "@testing-library/react";
import { AuthProvider } from "../src/context/auth";

/**
 * Render con Provider + Router. Te permite pasar rutas personalizadas si lo necesitas.
 * @param {React.ReactNode} ui
 * @param {Object} options
 * @param {string[]} options.initialEntries rutas iniciales (por defecto ['/'])
 * @param {React.ReactNode} options.routes árbol de <Routes> (si no lo pasas, renderiza solo {ui})
 */
export function renderWithProviders(ui, { initialEntries = ["/"], routes } = {}) {
  const Wrapper = ({ children }) => (
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        {routes ? routes : children}
      </MemoryRouter>
    </AuthProvider>
  );
  return render(ui, { wrapper: Wrapper });
}
