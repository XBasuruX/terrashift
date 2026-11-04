"""Start both local services; terminate only the child processes owned here."""

from pathlib import Path
import os
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]


def main():
    python = ROOT / (
        ".venv/Scripts/python.exe" if os.name == "nt" else ".venv/bin/python"
    )
    if not python.exists():
        raise SystemExit(
            "Create .venv and install backend requirements first; see README."
        )
    npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
    if not npm:
        raise SystemExit("Install Node.js 22+ first.")
    commands = [
        [
            str(python),
            "-m",
            "uvicorn",
            "backend.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            "8000",
            "--reload",
        ],
        [npm, "run", "dev"],
    ]
    children = []
    try:
        for command in commands:
            children.append(
                subprocess.Popen(
                    command,
                    cwd=ROOT,
                    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
                    if os.name == "nt"
                    else 0,
                )
            )
        print(
            "TerraShift: http://127.0.0.1:3000 | API: http://127.0.0.1:8000/docs | Ctrl+C stops both.",
            flush=True,
        )
        while all(child.poll() is None for child in children):
            time.sleep(0.5)
    except KeyboardInterrupt:
        pass
    finally:
        for child in children:
            if child.poll() is None:
                if os.name == "nt":
                    # Kill the owned process tree, never an unrelated global Node/Python process.
                    subprocess.run(
                        ["taskkill", "/PID", str(child.pid), "/T", "/F"],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                else:
                    child.terminate()
        for child in children:
            try:
                child.wait(timeout=5)
            except subprocess.TimeoutExpired:
                child.kill()


if __name__ == "__main__":
    main()
