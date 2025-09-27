import "@testing-library/jest-dom";

// Limpia mocks y storage entre tests
import { afterEach, vi } from "vitest";
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
