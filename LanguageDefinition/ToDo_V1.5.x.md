# ToDo V1.5.x (Ongoing Tasks)

Status: 25.09.2025

Goal: Stabilize current formatting rules, consolidate tests, no behavioral changes outside the items listed here.

## Rules / Clarifications (Documentation)

- Parenthesis spacing in control structures: Target style "IF (a == b) THEN" (no space directly after `(` nor before `)`).
- Remove trailing whitespace at end of lines.
- Empty lines: At most one consecutive empty line—even inside comment blocks consisting only of tabs/spaces.
- EOL/EOF: Edge cases covered by separate tests; monitor.
- Implement EOL edge case test (mixed LF/CRLF + no final newline).
- add a error-finder in code like (e.g. missing semicolons, unmatched brackets, missing END-Keywords).



## Tests
- Dynamic formatting settings testrunner: Implement a runner that can adjust settings (e.g. EmptyLinesAlsoInComment, allowedNumberOfEmptyLines) per test case to cover all configuration variants.
