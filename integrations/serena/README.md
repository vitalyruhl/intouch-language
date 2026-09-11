# Serena QuickScript Adapter

This directory contains the thin Serena/SolidLSP integration for the InTouch QuickScript language server. It contains the adapter needed to register and launch the server; QuickScript parsing and language semantics remain in the `intouch-language` LSP.

## Architecture

```text
Serena
  -> Python entry point: solidlsp.language_server_registration / quickscript
  -> QuickScript Serena adapter
  -> node dist/server.js --stdio
```

Serena discovers the installed adapter, registers the `quickscript` language-server ID, matches `.vbi` and `.vi` files, and starts the external LSP itself over stdio. It does not look for an already-running LSP process.

## Development Installation

Install the adapter into Serena's virtual environment in editable mode:

```powershell
uv pip install --python <serena-venv-python> --no-deps -e <path-to-this-intouch-language-repository>/integrations/serena
```

Run it from any directory. For PR #1988 validation, use Serena commit `2f7946ded11a0e2dd467da8042c3521b3d209642`; an unchanged stock Serena installation does not provide the required registration API.

## Serena Configuration

Add the registered ID to the project's `.serena/project.yml`:

```yaml
language_servers:
  - quickscript
```

The adapter resolves the server entry point in this order:

1. `ls_specific_settings.quickscript.ls_path`
2. `INTOUCH_LANGUAGE_SERVER_PATH`

At PR #1988 commit `2f7946ded11a0e2dd467da8042c3521b3d209642`, Serena's settings lookup does not correctly match external IDs to string-keyed project settings. Therefore the configured `ls_specific_settings.quickscript.ls_path` path is currently not effective end-to-end; use `INTOUCH_LANGUAGE_SERVER_PATH` as the tested workaround. No Serena core patch is included here.

For example:

```yaml
ls_specific_settings:
  quickscript:
    ls_path: "C:/path/to/intouch-language/dist/server.js"
```

Or set the environment variable before starting Serena:

```powershell
$env:INTOUCH_LANGUAGE_SERVER_PATH = "C:\path\to\intouch-language\dist\server.js"
```

The built `dist/server.js` must exist, and Node.js must be available on `PATH`.

## Smoke Testing

Start Serena with a project containing `.vbi` or `.vi` files. Serena should discover the adapter, start `node dist/server.js --stdio`, and route document symbols, definitions, and references through the LSP. An isolated fixture can legitimately return zero definitions or references when it has no resolvable cross-file targets. Run the focused adapter tests from this repository with `pytest integrations/serena/tests/test_adapter.py`.

## Scope and Non-Goals

This integration does not provide:

- QuickScript parser or semantic logic outside the `intouch-language` LSP
- ProjectAtlas integration
- VS Code Marketplace detection
- `code --locate-extension` discovery
- automatic Node.js installation
- automatic adapter installation or a plugin manager
