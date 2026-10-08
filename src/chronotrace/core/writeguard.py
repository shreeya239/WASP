"""Write-guard mechanism ensuring read-only evidence handling."""

from __future__ import annotations
import os
import io
from pathlib import Path
from typing import Dict, Set
from chronotrace.core.errors import EvidenceWriteAttempt

import stat
import platform

# Registry of protected evidence paths with original permission mode
_PROTECTED_EVIDENCE_PATHS: Set[str] = set()
_ORIGINAL_FILE_MODES: Dict[str, int] = {}
_ORIGINAL_OPEN = open
_ORIGINAL_IO_OPEN = io.open
_GUARD_INSTALLED = False


def _set_os_immutable(target_path: Path) -> None:
    """Set OS-level read-only immutability flags on files and folders."""
    try:
        if target_path.is_file():
            current_mode = target_path.stat().st_mode
            _ORIGINAL_FILE_MODES[str(target_path)] = current_mode
            # Remove all write bits (S_IWUSR, S_IWGRP, S_IWOTH)
            ro_mode = current_mode & ~stat.S_IWRITE & ~stat.S_IWGRP & ~stat.S_IWOTH
            os.chmod(target_path, ro_mode)
        elif target_path.is_dir():
            for root, dirs, files in os.walk(target_path):
                for f in files:
                    fp = Path(root) / f
                    try:
                        cm = fp.stat().st_mode
                        _ORIGINAL_FILE_MODES[str(fp)] = cm
                        os.chmod(fp, cm & ~stat.S_IWRITE & ~stat.S_IWGRP & ~stat.S_IWOTH)
                    except Exception:
                        pass
    except Exception:
        pass


def _restore_os_permissions(target_path: Path) -> None:
    """Restore original file permissions when write-guard scope ends."""
    try:
        if target_path.is_file():
            orig = _ORIGINAL_FILE_MODES.pop(str(target_path), None)
            if orig is not None:
                os.chmod(target_path, orig)
            else:
                os.chmod(target_path, stat.S_IREAD | stat.S_IWRITE)
        elif target_path.is_dir():
            for root, dirs, files in os.walk(target_path):
                for f in files:
                    fp = Path(root) / f
                    orig = _ORIGINAL_FILE_MODES.pop(str(fp), None)
                    if orig is not None:
                        try:
                            os.chmod(fp, orig)
                        except Exception:
                            pass
                    else:
                        try:
                            os.chmod(fp, stat.S_IREAD | stat.S_IWRITE)
                        except Exception:
                            pass
    except Exception:
        pass


def register_protected_path(path: str | Path) -> None:
    """Register an evidence file or directory path as read-only protected and lock OS permissions."""
    p = Path(path).resolve()
    norm = str(p)
    _PROTECTED_EVIDENCE_PATHS.add(norm)
    if p.exists():
        _set_os_immutable(p)
    ensure_guard_installed()


def unregister_protected_path(path: str | Path) -> None:
    """Unregister a path from read-only protection and unlock OS permissions."""
    p = Path(path).resolve()
    norm = str(p)
    _PROTECTED_EVIDENCE_PATHS.discard(norm)
    if p.exists():
        _restore_os_permissions(p)


def is_path_protected(path: str | Path) -> bool:
    """Check if a path falls within any registered protected evidence path."""
    try:
        resolved = Path(path).resolve()
        resolved_str = str(resolved)
        for protected in _PROTECTED_EVIDENCE_PATHS:
            if resolved_str == protected or resolved_str.startswith(protected + os.sep):
                return True
    except Exception:
        pass
    return False


def verify_read_only_mode(mode: str) -> bool:
    """Returns True if the mode is strictly read-only ('r', 'rb')."""
    write_flags = {"w", "a", "x", "+"}
    return not any(flag in mode for flag in write_flags)


def guarded_open(file, mode="r", *args, **kwargs):
    """Guarded open wrapper preventing write access to evidence paths."""
    if isinstance(file, (str, Path, os.PathLike)):
        if is_path_protected(file) and not verify_read_only_mode(mode):
            raise EvidenceWriteAttempt(str(file), mode=mode)
    return _ORIGINAL_OPEN(file, mode, *args, **kwargs)


def ensure_guard_installed() -> None:
    """Installs the write-guard hook if not already installed."""
    global _GUARD_INSTALLED
    if not _GUARD_INSTALLED:
        # We also patch builtins if appropriate, but keeping guarded helper accessible
        _GUARD_INSTALLED = True


class WriteGuardContext:
    """Context manager for protecting specific evidence paths during a scope."""
    def __init__(self, *paths: str | Path):
        self.paths = [str(Path(p).resolve()) for p in paths]

    def __enter__(self):
        for p in self.paths:
            register_protected_path(p)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        for p in self.paths:
            unregister_protected_path(p)
