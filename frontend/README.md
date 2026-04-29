# Frontend (React + Vite)

## Getting started

From the repo root:

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

App runs at `http://localhost:5173`.

## Environment variables

Create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:5000/api/todos
VITE_AUTH_API_URL=http://localhost:5000/api/auth
```
