# QuickScript Grammar

This document is the canonical syntax contract for the QuickScript subset
implemented by the extension. It describes InTouch QuickScript, not Visual
Basic, VBA, VBScript, Pascal, PowerShell, or JavaScript.

## Evidence and dialect boundary

The grammar is based, in descending order of authority, on:

1. AVEVA InTouch and System Platform documentation for QuickScript statement
   termination, brace comments, control structures, and operator families;
2. repository QuickScript in `LanguageDefinition/test.vbi` and the `.vbi` / `.vi`
   formatter fixtures;
3. `packages/core/src/languageData.ts`, `syntaxes/intouch.tmLanguage.json`, and
   `snippets/vbi.json`;
4. parser, formatter, language-server, and behavior-baseline tests.

The AVEVA QuickScript .NET manuals also describe `FOR EACH`, `ELSEIF`,
`TRY`/`CATCH`, and a `WHILE` form. Those constructs are not assumed to be valid
classic InTouch QuickScript merely because the related dialect supports them.
`FOR EACH`, `ELSEIF`, and `TRY`/`CATCH` remain outside the implemented grammar.
The repository-evidenced `WHILE expression` / `NEXT;` form remains supported.

## Lexical elements

The tokenizer is the lexical authority. The grammar consumes its identifiers,
keywords, datatypes, number and string literals, operators, punctuation,
comments, newlines, and EOF token. Comments are trivia for syntax. Newlines are
statement recovery boundaries but do not replace required semicolons.

Identifiers include normal, system, and instance-qualified names supported by
the tokenizer. Member and instance access use `.`, `->`, and `:`. Bracketed
index access is accepted after an assignable or expression primary.

## Expressions

The expression parser uses the following precedence, from lowest to highest:

```ebnf
expression       = logicalOr ;
logicalOr        = logicalAnd, { ("OR" | "XOR" | "|"), logicalAnd } ;
logicalAnd       = comparison, { "AND", comparison } ;
comparison       = shift, { ("==" | "<>" | "<" | "<=" | ">" | ">=" | "IS"), shift } ;
shift            = additive, { ("SHL" | "SHR"), additive } ;
additive         = multiplicative, { ("+" | "-"), multiplicative } ;
multiplicative   = unary, { ("*" | "/" | "%" | "MOD"), unary } ;
unary            = { "+" | "-" | "NOT" | "!" | "~" }, postfix ;
postfix          = primary, { callSuffix | memberSuffix | indexSuffix } ;
primary          = identifier | number | string | "TRUE" | "FALSE" |
                   "NULL" | "EOF" | "(", expression, ")" ;
callSuffix       = "(", [ expression, { ",", expression } ], ")" ;
memberSuffix     = ("." | "->" | ":"), identifier ;
indexSuffix      = "[", expression, "]" ;
```

Function names are syntactic identifiers. Whether a callable is a known
InTouch, Hermes, or workspace QuickFunction is a separate semantic diagnostic.

## Statements

```ebnf
document          = { statement | comment } ;

statement         = dimStatement | assignment | callStatement |
                    directCallStatement | commandStatement |
                    ifHeader | elseHeader | endifStatement |
                    forHeader | nextStatement | whileHeader | exitForStatement |
                    returnStatement ;

dimStatement      = "DIM", identifier, { ",", identifier }, "AS", datatype, ";" ;
assignment        = assignable, "=", expression, ";" ;
callStatement     = "CALL", callable, "(", [ arguments ], ")", ";" ;
directCallStatement = callable, "(", [ arguments ], ")", ";" ;
commandStatement  = commandName, expression, ";" ;
arguments         = expression, { ",", expression } ;
assignable        = identifier, { memberSuffix | indexSuffix } ;
callable          = identifier, { memberSuffix } ;
commandName       = "ACTIVATEAPP" | "HIDE" | "PLAYSOUND" | "SENDKEYS" |
                    "SHOW" | "STARTAPP" ;

ifHeader          = "IF", expression, "THEN" ;
elseHeader        = "ELSE" ;
endifStatement    = "ENDIF", ";" ;

forHeader         = "FOR", identifier, "=", expression, "TO", expression,
                    [ "STEP", expression ] ;
nextStatement     = "NEXT", ";" ;
whileHeader       = "WHILE", expression ;

exitForStatement  = "EXIT", "FOR", ";" ;
returnStatement   = "RETURN", [ expression ], ";" ;
```

`IF` bodies may start on the same physical line. Inline forms such as
`IF condition THEN EXIT FOR; ENDIF;` are therefore valid. A multiline `IF`
condition may continue across newlines when the preceding physical line ends
in `AND`, `OR`, or `NOT`.

`FOR` and the repository-evidenced `WHILE` form are closed by `NEXT;`.
`EXIT FOR;` never opens or closes a loop.

A function call may be used as a statement with or without `CALL`, as shown by
the repository corpus. Other bare expressions are not statements. In
particular, `X + X + 1;` is invalid while `X = X + 1;` is an assignment.
The listed classic command statements use the repository-evidenced
parenthesis-free form; the same names may still use normal call syntax when
followed by `(`.

## Terminators

| Production | Required terminator |
| --- | --- |
| `DIM`, assignment, `CALL`, direct call, command, `EXIT FOR`, `RETURN` | `;` |
| `ENDIF`, `NEXT` | `;` |
| `IF ... THEN`, `ELSE`, `FOR ... TO ... [STEP ...]`, `WHILE ...` | none |

Consequently, `THEN;` and `ELSE;` contain an unexpected terminator. A newline
does not satisfy a missing terminator on an assignment or other terminated
statement.

## Recovery contract

The parser reports the nearest violated expectation and then synchronizes at a
semicolon, a physical newline, `ELSE`, `ENDIF`, `NEXT`, another recognized
statement start, or EOF. A malformed loop-shaped header is recovered as an
open loop only for nesting, so its later `NEXT;` does not become a second
primary error.

Missing delimiters, `THEN`, `TO`, `=`, and required semicolons are reported at
the missing position or conflicting token. Unexpected semicolons are reported
on the semicolon itself. Function-name and datatype validation remains semantic
and does not change expression syntax.

## Known open areas

- Classic InTouch evidence is still required before enabling `FOR EACH`,
  `ELSEIF`, `TRY`/`CATCH`, or a different `WHILE` terminator.
- The tokenizer recognizes a small compatibility set of symbolic operators;
  only the precedence groups documented above are parsed.
- The grammar validates syntax and nesting but does not perform type checking,
  overload resolution, constant folding, or runtime tag validation.
