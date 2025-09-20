import '@testing-library/jest-dom'

// Limpieza básica entre tests
beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})
