# WASP UI Audit Report

**Date:** 2026-10-07  
**Auditor:** Antigravity AI  
**Repository:** `WASP` — Wide-scope Artifact & Super-timeline Platform  
**Version:** 1.4.0

---

## 1. Existing Architecture

```
WASP/
├── src/chronotrace/          # Core Python forensic engine
│   ├── acquire/              # Evidence acquisition (hasher, imager, TSA, hotplug)
│   ├── analysis/             # Anomaly detection, Sigma rules, process lineage, corroboration
│   ├── artifacts/            # Forensic parsers (EVTX, browser, LNK, logs, MFT, prefetch, registry)
│   ├── cli/                  # Typer CLI (main.py) — full command suite
│   ├── core/                 # Case mgmt, models, config, bundle, write-guard
│   ├── extract/              # Extraction engine and plugins
│   ├── gui/                  # Tkinter desktop GUI (app.py)
│   ├── ingest/               # Evidence view
│   ├── integrity/            # Merkle tree, custody ledger, verifier
│   ├── normalize/            # Timezone, vocabulary normalizers
│   ├── report/               # Jinja2 HTML/MD/JSON/CSV report builder
│   └── timeline/             # Timeline builder, query, SQLite/Parquet store
├── web/index.html            # Existing "web" UI — a STATIC HTML file, not a real SPA
├── run_artifacts/            # Live case data (CASE-2026-LIVE with full derived data)
├── tests/                    # 29 pytest unit/integration tests
├── wasp.py                   # CLI entry point
├── launch_gui.py             # Desktop GUI launcher
├── launch_web.py             # Opens web/index.html in browser (no server)
└── run_demo.py               # Demo runner
```

---

## 2. Existing Frontend

### Status: **STATIC HTML FILE — No real web server**

- `web/index.html` is a single self-contained HTML file (inline CSS + JS)
- `launch_web.py` opens it with `webbrowser.open(file:///...)`
- **No HTTP server involved** — opens as a local file
- Contains **hard-coded demo data** (fake forensic events, lineage trees, anomalies)
- Uses neon/cyberpunk aesthetic (cyan, amber, dark blue) — tactical-gaming style
- Has views for: Timeline, Process Lineage, Anomaly Detection, Bundle Export
- **NOT connected to the actual backend** — all data is JavaScript constants
- Verdict: A demo mockup, not a functional web application

---

## 3. Existing Backend

### Status: **CLI-only + Desktop Tkinter GUI**

- Full forensic engine implemented in Python (`src/chronotrace/`)
- **No HTTP API server exists** — there is no Flask/FastAPI/Django server
- Desktop GUI (`gui/app.py`) wraps the engine using Tkinter
- FastAPI and uvicorn **are installed** in the environment (available to use)
- All core operations return Python objects / write to disk

---

## 4. Existing APIs

### Status: **None (CLI & Python API only)**

No HTTP REST API exists. All functionality is exposed via:
- Python imports (programmatic)
- CLI commands (`python wasp.py <command>`)

**Installed and available for API creation:**
- `fastapi>=0.136.1`
- `uvicorn>=0.46.0`
- `pydantic>=2.13.5`

---

## 5. Existing Forensic Modules

| Module | File | Status |
|--------|------|--------|
| Evidence Acquisition | `acquire/imager.py` | ✅ Working |
| SHA-256 Hasher | `acquire/hasher.py` | ✅ Working |
| RFC 3161 TSA | `acquire/tsa.py` | ✅ Working |
| USB Hotplug | `acquire/hotplug.py` | ✅ Working |
| Device Discovery | `acquire/devices.py` | ✅ Working |
| Evidence Manifest | `acquire/manifest.py` | ✅ Working |
| EVTX Parser | `artifacts/evtx.py` | ✅ Working |
| Browser History | `artifacts/browser.py` | ✅ Working |
| LNK Parser | `artifacts/lnk.py` | ✅ Working |
| Linux Logs | `artifacts/logs.py` | ✅ Working |
| NTFS MFT | `artifacts/ntfs_mft.py` | ✅ Working |
| Prefetch | `artifacts/prefetch.py` | ✅ Working |
| Registry | `artifacts/registry.py` | ✅ Working |
| Anomaly Detection | `analysis/anomalies.py` | ✅ Working |
| Sigma Rules | `analysis/sigma.py` | ✅ Working (built-in rules) |
| Process Lineage | `analysis/lineage.py` | ✅ Working |
| Corroboration | `analysis/corroborator.py` | ✅ Working |
| YARA/Rules | `analysis/rules.py` | ⚠️ Requires yara-python (may fail on some systems) |
| Integrity Verifier | `integrity/verifier.py` | ✅ Working |
| Merkle Tree | `integrity/merkle.py` | ✅ Working |
| Custody Ledger | `integrity/ledger.py` | ✅ Working |
| Timeline Builder | `timeline/builder.py` | ✅ Working |
| Timeline Store | `timeline/store.py` | ✅ SQLite + Parquet |
| Report Builder | `report/builder.py` | ✅ HTML/MD/JSON/CSV |
| Case Management | `core/case.py` | ✅ Working |
| Write-Guard | `core/writeguard.py` | ✅ Working |
| Bundle Export | `core/bundle.py` | ✅ Working |

---

## 6. Existing CLI Commands

```
wasp case create/info
wasp acquire
wasp ingest / extract
wasp timeline
wasp lineage
wasp anomaly
wasp sigma
wasp corroborate
wasp scan (YARA)
wasp verify
wasp report
wasp timestamp
wasp doctor
wasp device list/watch
wasp bundle export/verify
wasp gui
wasp web
wasp plugin list
```

---

## 7. Existing Report Functionality

- **HTML Report:** Full Jinja2-rendered interactive HTML (`reports/<case_id>_full.html`)
- **Markdown Summary:** (`reports/<case_id>_summary.md`)
- **JSON Export:** Machine-readable with all events (`reports/<case_id>_full.json`)
- **CSV Export:** Tabular event data (`reports/<case_id>_full.csv`)
- Redaction engine: anonymizes usernames, IPs, paths
- Registered in manifest with SHA-256 digest

---

## 8. Existing Timeline Functionality

- `TimelineBuilder` merges events from all artifact plugins
- Deduplicates by deterministic `event_id` (UUIDv5)
- Sorts by `(timestamp_utc, event_id)`
- Persists to:
  - `derived/timeline.jsonl` (canonical event stream)
  - `index/events.parquet` (columnar analytics, Zstd compressed)
  - `index/events.sqlite` (SQLite with FTS5 full-text search)
- Query engine in `timeline/query.py`

---

## 9. Existing Hashing/Integrity Functionality

- Streaming SHA-256 hasher (reads in 1MB blocks)
- SHA-256 sidecar files (`.sha256`) per evidence file
- RFC 3161 TSA cryptographic timestamps (`.tsr` files)
- Hash-chained custody ledger (`custody/ledger.jsonl`)
- Merkle tree root across all derived/index files
- Full integrity verifier: re-hashes evidence, replays ledger, validates Merkle root
- HMAC-SHA256 signed `.wasp` case bundles

---

## 10. Existing Anomaly Detection

- Statistical burst detection (Z-score sliding window)
- Off-hours logon detection (configurable hours, weekend detection)
- Rapid mass file modification / ransomware pattern detection
- Results saved to `derived/anomalies.json`

**Live case data has:**
- `BURST-1990256`: Activity spike (12 events, Z=2.18, MEDIUM)
- `OFFHOURS-...`: Off-hours admin login at 02:14 UTC (HIGH)

---

## 11. Existing Sigma/YARA Functionality

### Sigma
- Native built-in Sigma-compatible rule engine (no external sigma dependency)
- 6 built-in rules: Shadow Copy Deletion, Mimikatz LSASS, PowerShell Encoded, Certutil LOLBin, Event Log Cleared, Scheduled Task Persistence
- Supports external `.yml` rule directories
- Results saved to `derived/sigma_alerts.json`
- **Live case match:** sigma-log-005 "Event Log Cleared" (CRITICAL, T1070.001)

### YARA
- Requires `yara-python>=4.5.0`
- May fail silently if yara-python not properly compiled
- Results saved to `derived/threat_alerts.json`
- **Live case:** `threat_alerts.json` is empty (`[]`) — YARA did not produce results

---

## 12. Existing Tests

29 pytest tests covering:
- Anomaly detection (burst, off-hours, ransomware)
- Bundle export/verify
- Cross-source corroboration
- Device discovery/acquisition
- End-to-end forensic pipeline
- Hotplug detection
- Integrity (hasher, ledger, tamper detection, Merkle)
- Process lineage reconstruction
- Event models
- Plugin system
- Threat rules
- Sigma rule matching
- Timeline reconstruction
- RFC 3161 TSA timestamping
- Write-guard enforcement

---

## 13. Live Case Data Available

`run_artifacts/CASE-2026-LIVE/` contains a **fully processed real case**:

- **Case ID:** CASE-2026-LIVE
- **Examiner:** Alex Mercer (Senior Forensics Examiner)
- **Evidence:** 6 files (auth.log, bash_history, exfiltrated_files.zip, History, investigation_memo.docx, Security_Events.jsonl)
- **Timeline:** 28 events across multiple artifact sources
- **Anomalies:** 2 detected (burst + off-hours login)
- **Sigma:** 1 match (Event Log Cleared, CRITICAL)
- **Process Lineage:** 4 root processes (wget, chmod, cmd.exe, payload.sh)
- **Corroboration:** 1 timestomp conflict (MODIFIED_PRE_CREATION)
- **Merkle Root:** `1f391b61693c7b2b09351f374b6d5df4ace8b03f1b34d866e1d76000262cf4f6`
- **Reports:** HTML/MD/JSON/CSV already generated

---

## 14. Recommended Integration Approach

### Strategy: **FastAPI REST API wrapping the existing engine**

Since no HTTP API exists, create a thin FastAPI layer that:
1. Reads from existing case directories on disk
2. Calls existing Python functions from `chronotrace` modules
3. Returns JSON responses to the frontend
4. **Does NOT replace or rewrite any forensic modules**

### Approach:
```
Frontend (React/Vite) → FastAPI Backend → chronotrace Python modules
                                        → case directory JSON/JSONL files
```

**API Base:** `http://localhost:8000/api/v1/`  
**Frontend:** `http://localhost:5173/`

### Endpoints to create:
- `GET /cases` — list all case directories
- `GET /cases/{id}` — case metadata from `case.json`
- `POST /cases` — create new case
- `GET /cases/{id}/evidence` — manifest evidence entries
- `POST /cases/{id}/verify` — run `case.verify()`
- `POST /cases/{id}/analyze` — run extraction + timeline
- `GET /cases/{id}/timeline` — read `derived/timeline.jsonl`
- `GET /cases/{id}/anomalies` — read `derived/anomalies.json`
- `GET /cases/{id}/sigma` — read `derived/sigma_alerts.json`
- `GET /cases/{id}/lineage` — read `derived/process_lineage.json`
- `GET /cases/{id}/corroboration` — read `derived/corroboration.json`
- `POST /cases/{id}/report` — run `case.report()`
- `GET /cases/{id}/reports` — list generated reports
- `GET /health` — system health

---

## 15. Problems Discovered

| # | Problem | Severity | Action |
|---|---------|----------|--------|
| 1 | `web/index.html` has **hard-coded fake data** | HIGH | Replace with real API-connected SPA |
| 2 | **No HTTP server** — opens as `file://` URL | HIGH | Build FastAPI server |
| 3 | YARA results empty in live case (`[]`) | MEDIUM | Display gracefully with unavailability notice |
| 4 | `launch_web.py` cannot serve the app over network | HIGH | New Vite dev server |
| 5 | Existing web UI has neon/gaming aesthetic | LOW | Replace with professional UI |
| 6 | No case list endpoint — no multi-case management | MEDIUM | Implement case discovery by directory scan |
| 7 | No evidence upload via UI | MEDIUM | Create thin wrapper using `Case.acquire()` |
| 8 | Timeline JSONL can be large — no pagination | LOW | Implement server-side filtering |
| 9 | `python-version` file shows 3.14 (pre-release) | LOW | Document in setup guide |
| 10 | No CORS headers if frontend runs on different port | HIGH | Add FastAPI CORS middleware |
