import os
import sys
import json
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

src_dir = Path(__file__).parent.parent / 'src'
sys.path.insert(0, str(src_dir))

try:
    from chronotrace.core.case import Case
    from chronotrace.core.models import Event
except ImportError as e:
    raise RuntimeError(f"Failed to import WASP core: {e}")

try:
    import yara
    yara_available = True
except ImportError:
    yara_available = False

app = FastAPI(title='WASP API', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cases_dir = Path(os.environ.get("WASP_CASES_DIR", r"a:\wasp\WASP\run_artifacts"))

analysis_status: Dict[str, str] = {}

class CaseCreateReq(BaseModel):
    case_id: str
    examiner: str
    description: str
    organization: str
    authorization_ref: str

class ReportGenerateReq(BaseModel):
    formats: List[str] = ['html', 'json', 'csv', 'md']

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "ok",
        "version": "1.0.0",
        "yara_available": yara_available,
        "cases_dir": str(cases_dir),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@app.get("/api/v1/cases")
def list_cases():
    results = []
    if not cases_dir.exists():
        return results
    for case_dir in cases_dir.iterdir():
        if case_dir.is_dir() and (case_dir / "case.json").exists():
            try:
                with open(case_dir / "case.json", "r", encoding="utf-8") as f:
                    meta = json.load(f)
                
                manifest_path = case_dir / "manifest.json"
                evidence_count = 0
                if manifest_path.exists():
                    with open(manifest_path, "r", encoding="utf-8") as f:
                        man_data = json.load(f)
                        evidence_count = len(man_data.get("evidence", []))
                
                timeline_path = case_dir / "derived" / "timeline.jsonl"
                timeline_events_count = 0
                status = "pending"
                if timeline_path.exists():
                    status = "analyzed"
                    with open(timeline_path, "r", encoding="utf-8") as f:
                        timeline_events_count = sum(1 for line in f if line.strip())
                
                anomalies_path = case_dir / "derived" / "anomalies.json"
                has_anomalies = False
                if anomalies_path.exists():
                    with open(anomalies_path, "r", encoding="utf-8") as f:
                        has_anomalies = len(json.load(f)) > 0
                
                sigma_path = case_dir / "derived" / "sigma_alerts.json"
                has_sigma = False
                sigma_alerts = []
                if sigma_path.exists():
                    with open(sigma_path, "r", encoding="utf-8") as f:
                        sigma_alerts = json.load(f)
                        has_sigma = len(sigma_alerts) > 0
                
                reports_dir = case_dir / "reports"
                has_reports = False
                if reports_dir.exists():
                    has_reports = any(f.suffix == ".html" for f in reports_dir.iterdir())
                
                # Risk level
                risk_score = len(sigma_alerts) + (1 if has_anomalies else 0)
                risk_level = "LOW"
                if any("CRITICAL" in a.get("level", "").upper() for a in sigma_alerts):
                    risk_level = "CRITICAL"
                elif risk_score >= 3:
                    risk_level = "HIGH"
                elif risk_score >= 1:
                    risk_level = "MEDIUM"
                
                results.append({
                    "case_id": meta.get("case_id"),
                    "case_name": meta.get("description"),
                    "examiner": meta.get("examiner"),
                    "created_utc": meta.get("created_utc"),
                    "status": status,
                    "evidence_count": evidence_count,
                    "timeline_events_count": timeline_events_count,
                    "has_anomalies": has_anomalies,
                    "has_sigma": has_sigma,
                    "has_reports": has_reports,
                    "risk_level": risk_level
                })
            except Exception as e:
                continue
    return results

@app.get("/api/v1/cases/{case_id}")
def get_case(case_id: str):
    case_dir = cases_dir / case_id
    if not (case_dir / "case.json").exists():
        raise HTTPException(status_code=404, detail="Case not found")
    
    try:
        with open(case_dir / "case.json", "r", encoding="utf-8") as f:
            meta = json.load(f)
            
        manifest_path = case_dir / "manifest.json"
        evidence_entries = []
        if manifest_path.exists():
            with open(manifest_path, "r", encoding="utf-8") as f:
                man_data = json.load(f)
                evidence_entries = man_data.get("evidence", [])
                
        status = "pending"
        has_timeline = (case_dir / "derived" / "timeline.jsonl").exists()
        if has_timeline:
            status = "analyzed"
            
        has_anomalies = False
        anom_path = case_dir / "derived" / "anomalies.json"
        if anom_path.exists():
            with open(anom_path, "r", encoding="utf-8") as f:
                has_anomalies = len(json.load(f)) > 0
                
        has_sigma = False
        sig_path = case_dir / "derived" / "sigma_alerts.json"
        if sig_path.exists():
            with open(sig_path, "r", encoding="utf-8") as f:
                has_sigma = len(json.load(f)) > 0
                
        has_lineage = (case_dir / "derived" / "process_lineage.json").exists()
        
        merkle_root = man_data.get("merkle_root") if manifest_path.exists() else None
        
        return {
            "case_id": meta.get("case_id"),
            "description": meta.get("description"),
            "examiner": meta.get("examiner"),
            "organization": meta.get("organization"),
            "created_utc": meta.get("created_utc"),
            "authorization_ref": meta.get("authorization_ref"),
            "schema_version": meta.get("schema_version"),
            "tool_version": meta.get("tool_version"),
            "evidence_count": len(evidence_entries),
            "evidence_entries": evidence_entries,
            "has_timeline": has_timeline,
            "has_anomalies": has_anomalies,
            "has_sigma": has_sigma,
            "has_lineage": has_lineage,
            "merkle_root": merkle_root,
            "status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/cases")
def create_case(req: CaseCreateReq):
    try:
        case = Case.create(
            case_id=req.case_id,
            out_dir=cases_dir / req.case_id,
            examiner=req.examiner,
            organization=req.organization,
            authorization_ref=req.authorization_ref,
            description=req.description
        )
        return get_case(req.case_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/cases/{case_id}/evidence")
def list_evidence(case_id: str):
    case_dir = cases_dir / case_id
    manifest_path = case_dir / "manifest.json"
    if not manifest_path.exists():
        return []
    
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            man_data = json.load(f)
            
        evidence = man_data.get("evidence", [])
        result = []
        for ev in evidence:
            result.append({
                "evidence_id": ev.get("evidence_id"),
                "path": ev.get("path"),
                "filename": Path(ev.get("path", "")).name,
                "size_bytes": ev.get("size_bytes"),
                "sha256": ev.get("hashes", {}).get("sha256"),
                "acquired_utc": ev.get("acquired_utc"),
                "tsa_status": ev.get("timestamp_token", {}).get("status"),
                "verification_status": ev.get("verification", {}).get("result") == "match",
                "container": ev.get("container")
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/cases/{case_id}/verify")
def verify_case(case_id: str):
    try:
        case = Case.open(cases_dir / case_id)
        result = case.verify(rehash_evidence=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/cases/{case_id}/timeline")
def get_timeline(
    case_id: str,
    limit: int = 200,
    offset: int = 0,
    search: Optional[str] = None,
    severity: Optional[str] = None,
    action: Optional[str] = None,
    user: Optional[str] = None,
    source: Optional[str] = None
):
    case_dir = cases_dir / case_id
    timeline_path = case_dir / "derived" / "timeline.jsonl"
    if not timeline_path.exists():
        return {"events": [], "total": 0, "offset": offset, "limit": limit}
    
    events = []
    try:
        with open(timeline_path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip(): continue
                try:
                    ev = json.loads(line)
                except json.JSONDecodeError:
                    continue
                
                # compute severity
                tags = ev.get("tags", [])
                tags_upper = [t.upper() for t in tags]
                ev_severity = "INFO"
                if any(t in tags_upper for t in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]):
                    for s in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
                        if s in tags_upper:
                            ev_severity = s
                            break
                else:
                    conf = ev.get("confidence", 1.0)
                    act = ev.get("action", "")
                    if act == "PROCESS_START" and "execution" in [t.lower() for t in tags] and conf >= 0.95:
                        ev_severity = "HIGH"
                    elif act == "AUTH_LOGIN":
                        ev_severity = "MEDIUM"
                    elif act == "FILE_WRITE" and "TIMESTOMP" in tags_upper:
                        ev_severity = "HIGH"
                
                ev_action = ev.get("action", "")
                ev_user = ev.get("user", "")
                ev_source_art = ev.get("source", {}).get("artifact", "")
                
                # filters
                if search and search.lower() not in line.lower():
                    continue
                if severity and ev_severity != severity:
                    continue
                if action and ev_action != action:
                    continue
                if user and ev_user != user:
                    continue
                if source and ev_source_art != source:
                    continue
                
                events.append({
                    "event_id": ev.get("event_id"),
                    "timestamp_utc": ev.get("timestamp_utc"),
                    "action": ev_action,
                    "action_class": ev.get("action_class"),
                    "user": ev_user,
                    "host": ev.get("host"),
                    "object_path": ev.get("object", {}).get("path"),
                    "object_type": ev.get("object", {}).get("type"),
                    "artifact": ev_source_art,
                    "plugin": ev.get("source", {}).get("plugin"),
                    "evidence_id": ev.get("source", {}).get("evidence_id"),
                    "confidence": ev.get("confidence"),
                    "rationale": ev.get("rationale"),
                    "tags": ev.get("tags", []),
                    "warnings": ev.get("warnings", []),
                    "severity": ev_severity
                })
        
        total = len(events)
        sliced = events[offset:offset+limit]
        return {"events": sliced, "total": total, "offset": offset, "limit": limit}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _read_json_file(path: Path) -> Any:
    if not path.exists():
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/cases/{case_id}/anomalies")
def get_anomalies(case_id: str):
    return _read_json_file(cases_dir / case_id / "derived" / "anomalies.json")

@app.get("/api/v1/cases/{case_id}/sigma")
def get_sigma(case_id: str):
    return _read_json_file(cases_dir / case_id / "derived" / "sigma_alerts.json")

@app.get("/api/v1/cases/{case_id}/lineage")
def get_lineage(case_id: str):
    return _read_json_file(cases_dir / case_id / "derived" / "process_lineage.json")

@app.get("/api/v1/cases/{case_id}/corroboration")
def get_corroboration(case_id: str):
    val = _read_json_file(cases_dir / case_id / "derived" / "corroboration.json")
    if isinstance(val, list) and not val:
        return {}
    return val

@app.get("/api/v1/cases/{case_id}/threat-alerts")
def get_threats(case_id: str):
    if not yara_available:
        return []
    return _read_json_file(cases_dir / case_id / "derived" / "threat_alerts.json")

def analyze_task(case_id: str):
    try:
        case = Case.open(cases_dir / case_id)
        case.extract(profile="all")
        case.build_timeline()
        case.detect_anomalies()
        case.scan_sigma()
        analysis_status[case_id] = "complete"
    except Exception as e:
        analysis_status[case_id] = "failed"
        print(f"Analysis failed for {case_id}: {e}")

@app.post("/api/v1/cases/{case_id}/analyze")
def analyze_case(case_id: str, background_tasks: BackgroundTasks):
    analysis_status[case_id] = "running"
    background_tasks.add_task(analyze_task, case_id)
    return {"status": "started", "case_id": case_id, "message": "Analysis pipeline started"}

@app.get("/api/v1/cases/{case_id}/status")
def get_analysis_status(case_id: str):
    return {"status": analysis_status.get(case_id, "unknown")}

@app.get("/api/v1/cases/{case_id}/reports")
def list_reports(case_id: str):
    case_dir = cases_dir / case_id
    reports_dir = case_dir / "reports"
    if not reports_dir.exists():
        return []
    
    manifest_path = case_dir / "manifest.json"
    manifest_reports = {}
    if manifest_path.exists():
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                man_data = json.load(f)
                for r in man_data.get("reports", []):
                    manifest_reports[r.get("path")] = r.get("sha256")
        except:
            pass
            
    reports = []
    for f in reports_dir.iterdir():
        if f.is_file():
            rel_path = f"reports/{f.name}"
            reports.append({
                "filename": f.name,
                "format": f.suffix.lstrip("."),
                "path_relative": rel_path,
                "sha256": manifest_reports.get(rel_path),
                "size_bytes": f.stat().st_size,
                "generated_utc": datetime.datetime.fromtimestamp(f.stat().st_mtime, datetime.timezone.utc).isoformat()
            })
    return reports

@app.post("/api/v1/cases/{case_id}/reports/generate")
def generate_reports(case_id: str, req: ReportGenerateReq):
    try:
        case = Case.open(cases_dir / case_id)
        result = case.report(formats=tuple(req.formats))
        return {"generated": {k: str(v) for k, v in result.items()}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/cases/{case_id}/reports/{filename}")
def get_report(case_id: str, filename: str):
    report_path = cases_dir / case_id / "reports" / filename
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    
    if filename.endswith(".json"):
        return JSONResponse(content=_read_json_file(report_path))
    else:
        return FileResponse(path=report_path)
