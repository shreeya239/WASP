# WASP UI Implementation Report

**Date:** 2026-10-07
**Author:** Antigravity AI

## Executive Summary

A complete, professional web interface has been built for the WASP (Wide-scope Artifact & Super-timeline Platform) digital forensics project. The implementation respects the "DO NOT BREAK THE BACKEND" directive by leaving all existing `chronotrace` Python modules untouched and building a thin FastAPI layer to expose them to a new React frontend.

## 1. Architecture

- **Backend:** A new FastAPI server (`api/main.py`) acts as a bridge. It reads JSON/JSONL outputs directly from the case directories (e.g., `run_artifacts/CASE-2026-LIVE/`) and calls existing `Case` methods for operations like `verify()` and `analyze()`.
- **Frontend:** A React + Vite + TypeScript application (`wasp-ui/`) with a custom CSS design system that implements the requested professional, non-gaming aesthetic.

## 2. Design System

The visual design explicitly avoids neon colors, glowing borders, and "AI-generated" sci-fi aesthetics.

- **Colors:** Deep charcoal background (`#111318`), slate panels (`#1c2130`), muted steel blue accent (`#4a7fa5`).
- **Typography:** Inter/system-sans for UI text, IBM Plex Mono for technical data (timestamps, hashes, paths).
- **Semantics:** Strict severity colors applied only to badges and specific alerts (Critical = Red, High = Orange, Medium = Amber, Low/Verified = Green, Info = Blue).

## 3. Completed Features

### Core Infrastructure
- FastAPI backend serving `http://localhost:8000/api/v1/*`
- React/Vite dev server proxying API requests
- Global Context (`useActiveCase`) for managing the currently open investigation
- Axios API client with full TypeScript interfaces

### Dashboard (`/`)
- Unified case overview displaying evidence count, timeline events, and risk levels.
- Real-time cryptographic integrity status (SHA-256 verification).
- Preview of recent timeline events.
- Consolidated view of high-priority suspicious findings (Sigma + Anomalies).

### Case Management (`/cases`)
- Table view of all detected cases in the artifacts directory.
- Case creation modal that calls `Case.create()` to initialize a new valid case structure.

### Evidence (`/evidence`)
- Manifest viewer displaying cryptographic hashes, acquisition timestamps, and sizes.
- Interactive **Verify** button that calls `Case.verify()` and displays the full Integrity Ledger breakdown.
- Interactive **Analyze** button that triggers the full extraction and correlation pipeline as a background task.

### Super Timeline (`/timeline`)
- Searchable and filterable tabular view of all `timeline.jsonl` events.
- Visual severity badges derived from forensic tags.

### Investigation & Findings (`/investigation`)
- Consolidated view of Statistical Anomalies (Z-score bursts, off-hours access).
- Sigma Threat Rule matches mapped to MITRE ATT&CK.
- Anti-forensics corroboration conflicts (e.g., timestomping detection).

### Process Lineage (`/lineage`)
- Hierarchical recursive tree rendering of `process_lineage.json`.
- Visual highlighting of process nodes flagged with threat alerts.

### Rules & Detection (`/rules`)
- Status panels for both Sigma and YARA engines.
- Graceful degradation if `yara-python` is unavailable on the host system.

### Reports (`/reports`)
- Table of all generated report artifacts (HTML, MD, CSV, JSON).
- Interactive **Generate Reports** button triggering Jinja2 builds.

### System Status (`/system`)
- Live polling of backend health, engine availability, and system time.

## 4. Next Steps & Known Limitations

- **Authentication:** Currently, there is no auth layer. For deployment, standard JWT or OAuth should be added to the FastAPI wrapper.
- **Large Timelines:** The timeline view currently fetches events in batches but does not implement full virtualized scrolling for timelines with >1M events. Server-side pagination is implemented but the UI currently requests a fixed limit.
- **YARA on Windows:** `yara-python` requires C++ build tools which may fail on some systems. The API handles this gracefully and reports `yara_available: false`.
