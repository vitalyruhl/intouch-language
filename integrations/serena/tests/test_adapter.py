import os
import shutil
import subprocess
import sys

import pytest


def test_installed_entry_point_registers_quickscript():
    code = "from solidlsp.ls_config import LanguageServerRegistry; print(LanguageServerRegistry.get_instance().resolve('quickscript').get_key())"
    result = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, env=os.environ.copy(), timeout=20, check=False)
    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "quickscript"


@pytest.mark.parametrize("filename, expected", [("x.vbi", True), ("x.vi", True), ("x.VBI", True), ("x.VI", True), ("x.txt", False)])
def test_quickscript_filename_matching(filename, expected):
    from solidlsp.ls_config import LanguageServerRegistry

    matcher = LanguageServerRegistry.get_instance().resolve("quickscript").get_source_fn_matcher()
    assert matcher.is_relevant_filename(filename) is expected


def test_server_path_precedence_and_environment_fallback(tmp_path, monkeypatch):
    from intouch_language_serena.adapter import QuickScriptLanguageServer
    from solidlsp.settings import SolidLSPSettings

    configured = tmp_path / "configured server.js"
    environment = tmp_path / "environment server.js"
    configured.write_text("", encoding="utf-8")
    environment.write_text("", encoding="utf-8")
    monkeypatch.setenv("INTOUCH_LANGUAGE_SERVER_PATH", str(environment))
    provider = QuickScriptLanguageServer.DependencyProvider(SolidLSPSettings.CustomLSSettings({"ls_path": str(configured)}), None)
    assert provider._get_or_install_core_dependency() == str(configured)
    provider = QuickScriptLanguageServer.DependencyProvider(SolidLSPSettings.CustomLSSettings({}), None)
    assert provider._get_or_install_core_dependency() == str(environment)


def test_missing_server_path_and_node_are_actionable(tmp_path, monkeypatch):
    from intouch_language_serena.adapter import QuickScriptLanguageServer
    from solidlsp.settings import SolidLSPSettings

    provider = QuickScriptLanguageServer.DependencyProvider(SolidLSPSettings.CustomLSSettings({}), None)
    monkeypatch.delenv("INTOUCH_LANGUAGE_SERVER_PATH", raising=False)
    with pytest.raises(FileNotFoundError, match="ls_path"):
        provider._get_or_install_core_dependency()
    with pytest.raises(FileNotFoundError, match="entry point"):
        provider._create_launch_command(str(tmp_path / "missing.js"))
    existing = tmp_path / "server.js"
    existing.write_text("", encoding="utf-8")
    monkeypatch.setattr("intouch_language_serena.adapter.shutil.which", lambda _: None)
    with pytest.raises(FileNotFoundError, match="Node.js"):
        provider._create_launch_command(str(existing))


def test_launch_argv_preserves_spaced_path(tmp_path):
    from intouch_language_serena.adapter import QuickScriptLanguageServer
    from solidlsp.settings import SolidLSPSettings

    server = tmp_path / "folder with spaces" / "server.js"
    server.parent.mkdir()
    server.write_text("", encoding="utf-8")
    provider = QuickScriptLanguageServer.DependencyProvider(SolidLSPSettings.CustomLSSettings({}), None)
    command = provider._create_launch_command(str(server))
    assert command == [shutil.which("node"), str(server), "--stdio"]
