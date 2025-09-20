import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '../src/auth/Login' 

const BASE = 'http://localhost:3001'

function mockFetchOnce(data, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: async () => data
  })
}

test('login exitoso guarda usuario y llama onSuccess', async () => {
  const onSuccess = vi.fn()
  const fakeUser = { id: 'u1', username: 'dani', name: 'Daniela' }

  mockFetchOnce([fakeUser])

  render(<Login onSuccess={onSuccess} />)

  fireEvent.change(screen.getByLabelText(/username-input/i), { target: { value: 'dani' } })
  fireEvent.change(screen.getByLabelText(/password-input/i), { target: { value: '123' } })
  fireEvent.click(screen.getByLabelText(/login-submit/i))

  await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(fakeUser))
  expect(localStorage.getItem('user')).toContain('"username":"dani"')
  expect(global.fetch).toHaveBeenCalledWith(`${BASE}/users?username=dani&password=123`)
})

test('login fallido NO llama onSuccess', async () => {
  const onSuccess = vi.fn()
  mockFetchOnce([])

  render(<Login onSuccess={onSuccess} />)
  fireEvent.change(screen.getByLabelText(/username-input/i), { target: { value: 'bad' } })
  fireEvent.change(screen.getByLabelText(/password-input/i), { target: { value: 'bad' } })
  fireEvent.click(screen.getByLabelText(/login-submit/i))

  await waitFor(() => expect(onSuccess).not.toHaveBeenCalled())
})
