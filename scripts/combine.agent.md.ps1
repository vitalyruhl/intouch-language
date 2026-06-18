$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$outputPath = Join-Path $repoRoot "all-agents-combined.md"

$governanceFiles = @(
    "AGENTS.md"
    ".github/AGENTS.md"
    ".github/agents/control-plane.agent.md"
    ".github/agents/docs.agent.md"
    ".github/agents/refactor.agent.md"
    ".github/agents/workflow.agent.md"
)

$governanceFiles | ForEach-Object {
    $relativePath = $_
    $path = Join-Path $repoRoot $relativePath

    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Required governance file not found: $relativePath"
    }

    "## $relativePath"
    ""
    Get-Content -LiteralPath $path
    ""
    "---"
    ""
} | Set-Content -LiteralPath $outputPath -Encoding UTF8