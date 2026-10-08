"""WASP Local REST API Server for Forensic Web Console & External Integrations.

Provides a fast, deterministic JSON API for web clients to query events from SQLite FTS5,
retrieve process lineage trees, fetch statistical anomalies, inspect chain of custody,
and export signed bundles without running raw SQL directly in client-side JavaScript.
"""

from __future__ import annotations
import json
import sqlite3
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from typing import Any, Dict, List, Optional
import urllib.parse

from chronotrace.core.case import Case


class ForensicAPIHandler(BaseHTTPRequestHandler):
    """HTTP request handler serving REST API endpoints for WASP cases."""

    case_dir: Path = Path(".")

    def _send_json(self, data: Any, status: int = 200) -> None:
        payload = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self) -> None:
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path.rstrip("/")
        query = urllib.parse.parse_qs(parsed_url.query)

        try:
            case = Case.open(self.case_dir)
        except Exception as exc:
            self._send_json({"error": f"Failed to open case: {exc}"}, status=500)
            return

        # 1. API Health / Case Info
        if path in ("", "/api", "/api/v1", "/api/v1/info"):
            self._send_json({
                "status": "online",
                "version": "1.4.0",
                "case_id": case.case_id,
                "examiner": case.examiner,
                "organization": case.organization,
                "endpoints": [
                    "/api/v1/info",
                    "/api/v1/timeline",
                    "/api/v1/lineage",
                    "/api/v1/anomalies",
                    "/api/v1/integrity",
                ]
            })

        # 2. Timeline Query / FTS5 Full-Text Search
        elif path == "/api/v1/timeline":
            limit = int(query.get("limit", [100])[0])
            search_term = query.get("q", [""])[0]
            db_path = case.index_dir / "events.sqlite"

            if not db_path.exists():
                self._send_json({"events": [], "count": 0, "message": "Timeline SQLite index not built yet."})
                return

            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            if search_term:
                cursor.execute(
                    "SELECT * FROM events WHERE raw_json LIKE ? ORDER BY timestamp_utc ASC LIMIT ?",
                    (f"%{search_term}%", limit),
                )
            else:
                cursor.execute(
                    "SELECT * FROM events ORDER BY timestamp_utc ASC LIMIT ?",
                    (limit,),
                )

            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            self._send_json({"events": rows, "count": len(rows)})

        # 3. Process Lineage Trees
        elif path == "/api/v1/lineage":
            roots = case.build_lineage()
            self._send_json({"roots": [r.to_dict() for r in roots], "count": len(roots)})

        # 4. Statistical Anomalies
        elif path == "/api/v1/anomalies":
            findings = case.detect_anomalies()
            self._send_json({"anomalies": [f.to_dict() for f in findings], "count": len(findings)})

        # 5. Integrity Verification
        elif path == "/api/v1/integrity":
            res = case.verify()
            self._send_json(res)

        else:
            self._send_json({"error": "Endpoint not found"}, status=404)


def run_api_server(case_dir: Path, host: str = "127.0.0.1", port: int = 8080) -> None:
    """Launch local REST API server for WASP."""
    ForensicAPIHandler.case_dir = case_dir
    server = HTTPServer((host, port), ForensicAPIHandler)
    print(f"[*] WASP Forensic API Server listening at http://{host}:{port}/api/v1/info")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
