
push-path "C:\Daten\_Codding\intouch-language"

Get-ChildItem -Recurse -Filter *agent*.md | ForEach-Object {
     "## $($_.Name)"
     ""
     Get-Content -LiteralPath $_.FullName
     ""
     "---"
     ""
 } | Set-Content all-agents-combined.md
 
 pop-path
