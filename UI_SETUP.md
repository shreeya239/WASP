# WASP UI Setup Guide

This guide covers how to set up and run the WASP React frontend and FastAPI backend.

## Requirements

- Python >= 3.11 (Currently running Python 3.14 on this machine)
- Node.js >= 20 (Currently running v25)
- npm >= 10

## 1. Backend Setup

The backend is a thin FastAPI wrapper around the existing `chronotrace` python engine.

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   pip install fastapi uvicorn
   ```

2. Start the API server:
   ```bash
   python start_api.py
   ```

   The server will run at `http://localhost:8000`.

### Backend Environment Variables

- `WASP_CASES_DIR`: Path to the directory containing case folders (defaults to `./run_artifacts`)

## 2. Frontend Setup

The frontend is a React + TypeScript single-page application built with Vite.

1. Navigate to the frontend directory:
   ```bash
   cd wasp-ui
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The UI will be accessible at `http://localhost:5173`.

### Frontend Environment Variables

Vite proxies `/api` to `http://localhost:8000` automatically in development via `vite.config.ts`.
To build for production, you would set `VITE_API_URL` to your production API endpoint.

## Troubleshooting

- **YARA Unavailable**: If the System Status page shows YARA as unavailable, it means `yara-python` could not be compiled on your system. This is a common issue on Windows. The UI gracefully falls back and hides YARA alerts if this occurs.
- **CORS Errors**: The FastAPI backend is configured to allow all origins (`*`) by default for development. If you change this, ensure the frontend origin is whitelisted.
- **No Cases Found**: Ensure `WASP_CASES_DIR` points to a directory containing case folders (e.g., `CASE-2026-LIVE`), and that each case folder contains `case.json`.
