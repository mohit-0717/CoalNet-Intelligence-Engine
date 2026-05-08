# CoalNet API Config Fix TODO

- [x] Step 1: Create/update frontend/.env with VITE_API_BASE=http://localhost:3001
- [x] Step 2: Edit src/lib/api.ts to use VITE_API_BASE for API_URL
- [x] Step 3: Restart frontend dev server (run: cd CoalNet-main/frontend && npm run dev)
- [x] Step 4: Start backend if needed (cd CoalNet-main/backend && npm start), test page load/coal mines fetch, check backend console for /api/mines request (no log expected on success, error if DB fail)
