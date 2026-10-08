"""Tests for write-guard protection."""

import pytest
from pathlib import Path
from chronotrace.core.errors import EvidenceWriteAttempt
from chronotrace.core.writeguard import (
    WriteGuardContext,
    guarded_open,
    is_path_protected,
    register_protected_path,
    unregister_protected_path,
)


def test_writeguard_blocks_write_mode(tmp_path: Path):
    evidence_file = tmp_path / "disk.raw"
    evidence_file.write_bytes(b"FORENSIC_RAW_EVIDENCE_DATA")

    with WriteGuardContext(evidence_file):
        assert is_path_protected(evidence_file)

        # Read-only opens should succeed
        with guarded_open(evidence_file, "rb") as f:
            data = f.read()
            assert data == b"FORENSIC_RAW_EVIDENCE_DATA"

        # Write or append opens must raise EvidenceWriteAttempt
        with pytest.raises(EvidenceWriteAttempt):
            guarded_open(evidence_file, "wb")

        with pytest.raises(EvidenceWriteAttempt):
            guarded_open(evidence_file, "w")

        with pytest.raises(EvidenceWriteAttempt):
            guarded_open(evidence_file, "a")

    # Outside context, protection is unregistered
    assert not is_path_protected(evidence_file)


def test_writeguard_os_level_immutability_blocks_os_write(tmp_path: Path):
    """Negative control: Verify OS kernel rejects raw write open when guarded."""
    evidence_file = tmp_path / "disk_os.raw"
    evidence_file.write_bytes(b"ORIGINAL_EVIDENCE")

    with WriteGuardContext(evidence_file):
        # Raw built-in open (simulating C extension or external caller without guarded_open)
        with pytest.raises(PermissionError):
            with open(evidence_file, "wb") as f:
                f.write(b"TAMPER_PAYLOAD")

    # Outside context, permissions restored, write succeeds
    with open(evidence_file, "ab") as f:
        f.write(b"_APPENDED")
    assert evidence_file.read_bytes() == b"ORIGINAL_EVIDENCE_APPENDED"
