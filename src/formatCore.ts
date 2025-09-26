// Pure formatting core extracted from formats.ts for test fixture generation without vscode dependency
import { CRLF, TAB, KEYWORDS, SINGLE_OPERATORS, DOUBLE_OPERATORS, TRENNER, FORMATS, NO_SPACE_ITEMS, REGEX } from './const';
import { EXCLUDE_KEYWORDS, NESTINGS } from './nestingdef';

export interface FormatterConfig {
  allowedNumberOfEmptyLines?: number;
  RemoveEmptyLines?: boolean;
  EmptyLinesAlsoInComment?: boolean;
  BlockCodeBegin?: string;
  BlockCodeEnd?: string;
  BlockCodeExclude?: string;
  RegionBlockCodeBegin?: string;
  RegionBlockCodeEnd?: string;
  RegionBlockCodeExclude?: string;
  ReplaceTabToSpaces?: boolean;
  IndentSize?: number;
}

export function preFormat(text: string, config: FormatterConfig): string { // formerly forFormat (renamed to proper English)
  // Normalize all line endings to CRLF up front while preserving intent of single blank lines.
  // Replace any lone CR or LF with CRLF for internal processing.
  text = text.replace(/\r\n|\n|\r/g, '\r\n');
  let txt = text.split("");
  let buf: string = "";
  let modified: number = 0;
  let LineCount = 1;
  let ColumnCount = 0;
  let inComment = false;
  let inString = false;

  for (let i = 0; i <= txt.length - 1; i++) {
    ColumnCount++;
    if (modified > 0) {
      modified--;
    } else {
      modified = 0;
      if (inString && txt[i] === '"') {
        inString = false;
      } else if (!inComment && txt[i] === '"') {
        inString = true;
      }
      if (txt[i] === '\n') {
        if (inString) {
          return text; // abort on multi-line string error
        }
        LineCount++; ColumnCount = 0;
      }
      if (!inComment && txt[i] === '}') {
        return text; // malformed comment closure
      } else if (txt[i] === '{') {
        inComment = true;
      } else if (inComment && txt[i] === '}') {
        inComment = false;
      }
      if (!inString) {
        if (!(modified > 0) && (!inComment || (config as any).KeywordUppercaseAlsoInComment)) {
          // Keywords: replace slice with uppercase version WITHOUT consuming the following char ("after").
          // The previous implementation appended the following char and set modified accordingly, which could
          // duplicate CR characters or interfere with blank line handling when the next char was a line break.
          for (let kw of KEYWORDS) {
            const slice = text.substr(i, kw.length);
            const before = text[i - 1];
            const after = text[i + kw.length];
            if (slice.toLowerCase() === kw.toLowerCase()) {
              if (CheckCRLForWhitespace(before) && CheckCRLForWhitespace(after)) {
                buf += kw.toUpperCase();
                modified = kw.length - 1; // we consumed only the keyword characters
                break;
              }
            }
          }
          // Double operators
          if (!(modified > 0)) {
            for (let op of DOUBLE_OPERATORS) {
              const slice = text.substr(i, op.length);
              if (slice === op) {
                if (text[i - 1] !== ' ') buf += ' ';
                buf += op;
                if (text[i + op.length] !== ' ') buf += ' ';
                modified = op.length - 1;
                break;
              }
            }
          }
          // Single operators (improved spacing rules)
          if (!(modified > 0)) {
            const isIdentChar = (c: any) => /[A-Za-z0-9_$]/.test(c || '');
            const isVarStart = (c: any) => /[A-Za-z]/.test(c || '');
            const isVarBody = (c: any) => /[A-Za-z0-9$-]/.test(c || '');
            for (let op of SINGLE_OPERATORS) {
              if (txt[i] !== op) continue;

              // Detect multi-segment dashed identifier (e.g. new12-issue-dashed-variable) and keep dashes untouched.
              // Clarified rule: even simple letter-dash-letter (a-b) or e-f is a valid variable token and must remain unspaced.
              if (op === '-') {
                const prevCh = text[i - 1];
                const nextCh = text[i + 1];
                // Determine if dash sits inside a variable token according to rule:
                // Variable token pattern: [A-Za-z][A-Za-z0-9$-]* (segments after first letter may start with digits or $)
                if (isVarBody(prevCh) && isVarBody(nextCh)) {
                  let start = i - 1;
                  while (start >= 0 && isVarBody(text[start])) start--;
                  start++;
                  let end = i + 1;
                  while (end < text.length && isVarBody(text[end])) end++;
                  const token = text.slice(start, end);
                  if (isVarStart(text[start])) {
                    // Treat every dash inside such a token as part of variable (including single letter-dash-letter)
                    buf += '-';
                    modified = -1;
                    break;
                  }
                }
              }

              // Determine unary minus (attach to number) => previous non-space char is an operator boundary
              let unaryMinus = false;
              if (op === '-') {
                // look backwards for first non-space char already emitted in buf
                let k = buf.length - 1;
                while (k >= 0 && /[ \t]/.test(buf[k])) k--;
                const prev = k >= 0 ? buf[k] : undefined;
                const nextChar = text[i + 1];
                if ((prev === undefined || /[=+\-*/,(;{}]/.test(prev) || prev === '\n' || prev === '\r') && /[0-9]/.test(nextChar)) {
                  unaryMinus = true;
                }
              }

              // NEW rule: minus between identifiers (letters/underscore) must always be spaced as binary
              let isBinary = !(op === '-' && unaryMinus);

              // Space before (binary only)
              if (isBinary && buf.length > 0 && !/[ \t\r\n]/.test(buf[buf.length - 1])) {
                buf += ' ';
              }

              // Emit operator
              buf += op;

              // Space after (binary; plus always binary; keep unary minus tight with number)
              if (isBinary) {
                const next = text[i + 1];
                if (next && !/[ \t\r\n]/.test(next)) {
                  buf += ' ';
                }
              }

              modified = -1;
              break;
            }
          }
        }
      }
      if (modified === 0) {
        buf += txt[i];
      }
    }
  }
  // normalize spaces before semicolon + trim line tails
  // Sanitize any duplicated or stray carriage returns that may have been produced by earlier logic
  // Examples seen in tests: lines ending with an embedded "\r" (content + \r + CRLF) resulting from prior keyword logic.
  buf = buf
    .replace(/\r\r\n/g, CRLF)   // collapse CRCRLF -> CRLF
    .replace(/\r(?!\n)/g, '');   // remove lone CR not followed by LF
  let lines = buf.split(CRLF).map(l => l.replace(/\s+$/g, ''));
  // Preserve single blank lines: collapse only runs >1 here (final pipeline still may apply config rules).
  const newLines: string[] = [];
  let emptyRun = 0;
  for (const line of lines) {
    if (line === '') {
      emptyRun++;
      if (emptyRun === 1) newLines.push(''); // keep exactly one
      continue;
    } else {
      emptyRun = 0;
      newLines.push(line);
    }
  }
  let normalized = newLines.join(CRLF);
  // Post-processing normalizations:
  // 1. Ensure binary minus has space after when pattern like 'f -g' (but keep dashed identifiers like a-b-c)
  // 2. Collapse accidental double (or more) spaces between '=' and '>' in malformed '=  >' sequences
  // Apply targeted spacing fix outside of quoted strings only.
  normalized = (() => {
    let out = '';
    let inStr = false;
    let inComment = false;
    let inIfDepth = 0; // >0 while inside IF (...)
    const isIdentStart = (c: string) => /[A-Za-z]/.test(c);
    for (let i = 0; i < normalized.length; i++) {
      let ch = normalized[i];
      if (ch === '"') { inStr = !inStr; out += ch; continue; }
      if (!inStr) {
        // Track simple single-line comment braces { ... }
        if (ch === '{') { inComment = true; out += ch; continue; }
        if (ch === '}' && inComment) { inComment = false; /* fall through to spacing rule below */ }

        // IF keyword normalization (only when not in comment) patterns: if(  / if (
        if (!inComment && (ch === 'i' || ch === 'I') && (normalized[i+1] === 'f' || normalized[i+1] === 'F')) {
          // Normalize IF keyword followed by '(': style 'IF (a ... ) THEN'
          let j = i + 2; // after 'if'
          while (j < normalized.length && normalized[j] === ' ') j++;
          if (normalized[j] === '(') {
            out += 'IF (';
            // skip any spaces after '('
            let k = j + 1;
            while (k < normalized.length && normalized[k] === ' ') k++;
            inIfDepth = 1;
            i = k - 1; // continue from first non-space after '('
            continue;
          }
        }
        // After ')' followed by THEN (case-insensitive, maybe without space)
        if (!inComment && ch === ')') {
          // If we're closing IF (...), remove any trailing spaces before ')'
          if (inIfDepth > 0) {
            while (out.length > 0 && out[out.length - 1] === ' ') out = out.slice(0, -1);
            inIfDepth = 0;
          }
          out += ')';
          // Handle THEN following
          let j = i + 1; while (j < normalized.length && normalized[j] === ' ') j++;
          const ahead = normalized.slice(j, j + 4).toLowerCase();
          if (ahead === 'then') { out += ' THEN'; i = j + 3; continue; }
          // generic: ensure space after ')' if next is identifier
          let next = normalized[i+1];
          if (next && isIdentStart(next)) { out += ' '; }
          continue;
        }
        // Ensure space before inline comment brace directly after THEN (THEN{ -> THEN {)
        if (!inComment && (ch === 'T' || ch === 't') && normalized.slice(i, i+4).toLowerCase() === 'then') {
          let j = i + 4; while (j < normalized.length && normalized[j] === ' ') j++;
          if (normalized[j] === '{') {
            out += 'THEN ';
            i = i + 3; // consumed THEN
            continue;
          }
        }
        // Rule: ensure single space after semicolon if next char (non newline) is not space
        if (!inComment && ch === ';') {
          const next = normalized[i+1];
          if (next && next !== ' ' && next !== '\r' && next !== '\n') { out += '; '; continue; }
        }
        // Rule: ensure space after closing '}' of a comment if next non-space is identifier
        if (ch === '}' ) {
          let j = i + 1; while (j < normalized.length && normalized[j] === ' ') j++;
          if (j < normalized.length && isIdentStart(normalized[j]) && normalized[i+1] !== ' ') { out += '} '; continue; }
        }
        // Ensure space after pattern X -Y (but not inside dashed identifiers) => convert 'X -Y' to 'X - Y'
  if (!inComment && /[A-Za-z0-9_]/.test(ch) && normalized[i+1] === ' ' && normalized[i+2] === '-' && /[A-Za-z_]/.test(normalized[i+3])) {
          // Check that this is not inside a multi-dash variable: look backwards to start of run and forwards to end
          let back = out.length - 1; while (back >= 0 && /[A-Za-z0-9$-]/.test(out[back])) back--;
          let forward = i + 3; while (forward < normalized.length && /[A-Za-z0-9$-]/.test(normalized[forward])) forward++;
          const run = (out.slice(back + 1) + normalized.slice(i, forward));
          if (!/^[A-Za-z][A-Za-z0-9$-]*-[A-Za-z0-9$-]*-[A-Za-z0-9$-]*$/.test(run)) { out += ch + ' - ' + normalized[i+3]; i += 3; continue; }
        }
        // Comma spacing in argument lists: remove preceding spaces, enforce single space after unless next is ) or EOL
        if (!inComment && ch === ',') {
          while (out.length > 0 && out[out.length - 1] === ' ') out = out.slice(0, -1);
          out += ',';
          let next = normalized[i+1];
          if (next && next !== ' ' && next !== ')' && next !== '\r' && next !== '\n') { out += ' '; }
          continue;
        }
      }
      out += ch;
    }
    return out.replace(/= {2,}>/g, '= >');
  })();
  // Final sanitation: remove any spaces directly before semicolons outside strings/comments (strings already preserved above)
  // Remove spaces before semicolons only outside of string literals AND outside brace comments
  normalized = normalized.split(CRLF).map(line => {
    // Entire line is a single-line brace comment -> leave unchanged
    if (/^\s*\{[^{}]*\}\s*$/.test(line)) return line;
    // Split code part and trailing brace comment (if any)
    const braceIndex = line.indexOf('{');
    let codePart = line;
    let commentPart = '';
    if (braceIndex !== -1) {
      codePart = line.slice(0, braceIndex);
      commentPart = line.slice(braceIndex); // keep as-is
    }
    // Within codePart, protect strings, then remove spaces before semicolons
    const rebuilt = codePart.split(/("[^"\\]*(?:\\.[^"\\]*)*"?)/g).map(seg => {
      if (seg.startsWith('"') && seg.endsWith('"')) return seg; // string literal
      return seg.replace(/(\S)\s+;/g, '$1;');
    }).join('');
    return rebuilt + commentPart;
  }).join(CRLF);
  return normalized;
}

export function formatNestings(text: string, config: FormatterConfig): string {
  let buf = "";
  let codeFragments: string[] = [];
  let regex = "";
  let nestingCounter = 0;
  let nestingCounterPrevious = 0;
  // Simple nesting only; multiline IF experimental logic removed
  let multilineComment = false;
  let thisLineBack = false;
  // Multiline IF expression handling state
  let multiIfActive = false;
  let multiIfBaseDepth = 0;
  let regexCB = `^${config.BlockCodeBegin}`;
  let regexCEx = `^${config.BlockCodeExclude}`;
  let regexCE = `^${config.BlockCodeEnd}`;
  let regexRegionCB = `^${config.RegionBlockCodeBegin}`;
  let regexRegionCEx = `^${config.RegionBlockCodeExclude}`;
  let regexRegionCE = `^${config.RegionBlockCodeEnd}`;
  const hadFinalCRLF = text.endsWith(CRLF);
  codeFragments = text.split(CRLF);
  for (let i = 0; i < codeFragments.length; i++) {
    const prevMultilineState = multilineComment; // remember state entering this line
    let isEmptyLine = false;
    codeFragments[i] = codeFragments[i].replace(/\s+$/g, "");
    if (codeFragments[i] === "") isEmptyLine = true;
  if (codeFragments[i].search(REGEX.g_CHECK_OPEN_COMMENT) !== -1) multilineComment = true;
  if (codeFragments[i].search(REGEX.g_CHECK_CLOSE_COMMENT) !== -1) multilineComment = false;
    let str = codeFragments[i].match(REGEX.gm_GET_STRING);
    if (str) {
      // Protect ALL string literals on the line by masking spaces/tabs/semicolons
      let protectedLine = codeFragments[i];
      for (const item of str) {
        let strw = item.replace(/\s(?<!\t)/gim, "\0");
        strw = strw.replace(/\t/gim, "u0001");
        // Protect semicolons inside string so later rules don't re-space them
        strw = strw.replace(/;/g, 'u0002');
        protectedLine = protectedLine.replace(item, strw);
      }
      codeFragments[i] = protectedLine.replace(REGEX.gm_MOR_2_WSP, " ");
      if (!multilineComment) {
        for (let item in NO_SPACE_ITEMS) {
          // before
          regex = `((?![^{]*})\\s\\${NO_SPACE_ITEMS[item]})`;
          codeFragments[i] = codeFragments[i].replace(new RegExp(regex, 'g'), `${NO_SPACE_ITEMS[item]}`);
          // after
          regex = `((?![^{]*})(\\${NO_SPACE_ITEMS[item]}\\s))`;
          codeFragments[i] = codeFragments[i].replace(new RegExp(regex, 'g'), `${NO_SPACE_ITEMS[item]}`);
        }
        // space after ';'
        codeFragments[i] = codeFragments[i].replace(/(?![^{]*});(?!\s)/g, '; ');
        // remove space(s) before ';'
        codeFragments[i] = codeFragments[i].replace(/\s+;/g, ';');
      }
      codeFragments[i] = codeFragments[i]
        .replace(/\0/gim, ' ')
        .replace(/u0001/gim, '\t')
        .replace(/u0002/gim, ';');
    }
    // Capture original line before potential leading whitespace removal
    const originalLine = codeFragments[i];

    if (!isEmptyLine && !multilineComment) {
      const rawLine = codeFragments[i];
      const hasIF = /\bIF\b/i.test(rawLine);
      const hasTHEN = /\bTHEN\b/i.test(rawLine);
      const hasENDIF = /\bENDIF\b/i.test(rawLine);
      const inlineIf = hasIF && hasTHEN && hasENDIF; // single-line
      const continuationTrigger = hasIF && !hasTHEN && /(AND|OR|NOT)\s*$/i.test(rawLine.trim());

      let exclude = false;
  // Remove leading whitespace ONLY for lines that are subject to indentation logic.
  codeFragments[i] = codeFragments[i].replace(REGEX.gm_GET_NESTING, "");
      if (codeFragments[i].search(new RegExp(regexCB, 'gi')) !== -1) { nestingCounter++; }
      else if (codeFragments[i].search(new RegExp(regexCEx, 'gi')) !== -1) { thisLineBack = true; }
      else if (codeFragments[i].search(new RegExp(regexCE, 'gi')) !== -1) {
        nestingCounter--; thisLineBack = true; if (nestingCounter < 0) { nestingCounter = 0; thisLineBack = false; }
      }
      else if (codeFragments[i].search(new RegExp(regexRegionCB, 'gi')) !== -1) { nestingCounter++; }
      else if (codeFragments[i].search(new RegExp(regexRegionCEx, 'gi')) !== -1) { thisLineBack = true; }
      else if (codeFragments[i].search(new RegExp(regexRegionCE, 'gi')) !== -1) {
        nestingCounter--; thisLineBack = true; if (nestingCounter < 0) { nestingCounter = 0; thisLineBack = false; }
      } else {
        EXCLUDE_KEYWORDS.some(item => {
          regex = `((?![^{]*})(${item}))`;
          if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) exclude = true;
        });
        if (!multiIfActive) {
          if (inlineIf) {
            // no nesting change
          } else if (continuationTrigger) {
            multiIfActive = true;
            multiIfBaseDepth = nestingCounterPrevious; // visual base
          } else {
            for (let n of NESTINGS) {
              if (!exclude) {
                regex = `((?![^{]*})(\\b${n.keyword})\\b)`;
                if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) { nestingCounter++; }
              }
              if (n.multiline !== '') {
                regex = `((?![^{]*})(\\b${n.multiline})\\b)`;
                if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) { }
              }
              if (n.middle !== '') {
                regex = `((?![^{]*})(\\b${n.middle})\\b)`;
                if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) { thisLineBack = true; break; }
              }
              regex = `((?![^{]*})(\\b${n.end})\\b)`;
              if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) { nestingCounter--; if (nestingCounter < 0) nestingCounter = 0; thisLineBack = true; break; }
            }
          }
        } else {
          // multiIfActive
          if (hasTHEN) {
            nestingCounter++; // start IF body after this line
            thisLineBack = true; // keep THEN at expression level
            multiIfActive = false;
          }
        }
      }
    }
    if (!isEmptyLine) {
      // If we are inside a multi-line brace comment block OR this is the closing line
      // (previous line(s) were multiline comment and this one ends with a closing brace)
      // then we preserve indentation exactly as-is (no added / removed indent).
      const closesMultiline = prevMultilineState && codeFragments[i].includes('}');
      if (multilineComment || closesMultiline || prevMultilineState) {
        // Restore original line (with its original indentation) because we may have trimmed earlier logic
        codeFragments[i] = originalLine;
        multiIfActive = false; // reset multi-IF state when traversing comment blocks
        if (nestingCounterPrevious !== nestingCounter) nestingCounterPrevious = nestingCounter;
        continue;
      }

      // Determine visual depth for real code lines
      let visualDepth = nestingCounterPrevious;
      if (multiIfActive) {
        // lines after initial IF (continuation lines) show baseDepth+2 now (user request)
        const initialLine = /\bIF\b/i.test(codeFragments[i]) && !/\bTHEN\b/i.test(codeFragments[i]);
        if (!initialLine) visualDepth = multiIfBaseDepth + 2;
      } else if (thisLineBack && /\bTHEN\b/i.test(codeFragments[i])) {
        // THEN closing expression line: show continuation depth (base+2) and do NOT drop back
        visualDepth = (multiIfBaseDepth + 2);
        thisLineBack = false; // keep indentation level, prevent getNesting from skipping one level
      }
      const prefix = getNesting(visualDepth, thisLineBack, config);
      codeFragments[i] = prefix + codeFragments[i];
      if (nestingCounterPrevious !== nestingCounter) nestingCounterPrevious = nestingCounter;
      thisLineBack = false;
    }
  }
  // Final trailing whitespace cleanup
  codeFragments = codeFragments.map(l => l.replace(/[ \t]+$/g, ''));
  for (let i = 0; i < codeFragments.length; i++) {
    const isLast = i === codeFragments.length - 1;
    if (!isLast) buf += codeFragments[i] + CRLF; else {
      if (codeFragments[i] !== '') { buf += codeFragments[i]; if (hadFinalCRLF) buf += CRLF; }
    }
  }
  // Collapse multiple inner spaces (not leading indentation) outside of strings and outside single-line brace comments
  const collapsed = buf.split(CRLF).map(line => {
    if (line.trim() === '') return line;
    // Mask single-line brace comments { ... } to preserve interior spacing
    const comments = line.match(/\{[^{}\r\n]*\}/g) || [];
    const commentTokens: string[] = [];
    let masked = line;
    comments.forEach((c, idx) => {
      const token = `@@C${idx}@@`;
      commentTokens.push(c);
      masked = masked.replace(c, token);
    });
    // Split by string literals (simple non-escaped quote handling)
    const segments = masked.split(/("[^"\\]*(?:\\.[^"\\]*)*"?)/g).filter(s => s !== '');
    let rebuilt = '';
    segments.forEach(seg => {
      if (seg.startsWith('"') && seg.endsWith('"')) {
        rebuilt += seg; // keep string literal
      } else {
        const m = seg.match(/^(\s*)(.*)$/);
        if (m) {
          const ind = m[1];
          const rest = m[2].replace(/ {2,}/g, ' ');
          rebuilt += ind + rest;
        } else {
          rebuilt += seg.replace(/ {2,}/g, ' ');
        }
      }
    });
    // Restore comments
    commentTokens.forEach((c, idx) => {
      rebuilt = rebuilt.replace(`@@C${idx}@@`, c);
    });
    return rebuilt;
  }).join(CRLF);
  return collapsed;
}

function getNesting(n: number, thisLineBack: boolean, config: FormatterConfig): string {
  let temp = "";
  if (n !== 0) {
    // Determine indent unit based on configuration
    const useSpaces = (config.ReplaceTabToSpaces !== false); // default true
    const indentSize = (typeof config.IndentSize === 'number' && config.IndentSize >= 1 && config.IndentSize <= 10) ? config.IndentSize : 4;
    const indentUnit = useSpaces ? ' '.repeat(indentSize) : '\t';
    for (let i = 0; i < n; i++) {
      if (thisLineBack) { thisLineBack = false; } else { temp += indentUnit; }
    }
  }
  return temp;
}

function CheckCRLForWhitespace(s: string): boolean {
  if (s === undefined || s === '' || s === '\n' || s === '\r') return true; // line/file start boundaries
  return FORMATS.concat(SINGLE_OPERATORS, DOUBLE_OPERATORS, TRENNER).some(item => s === item);
}

export function pureFormatPipeline(text: string, config: FormatterConfig) {
  let formatted = preFormat(text, config);
  formatted = formatNestings(formatted, config);
  const nEL = (config.allowedNumberOfEmptyLines || 1) + 1.0;
  if (config.RemoveEmptyLines) {
    let regex: RegExp;
    if (config.EmptyLinesAlsoInComment) {
      regex = new RegExp(`(?![^{]*})(^[\t]*$\r?\n){${nEL},}`, 'gm');
    } else {
      regex = new RegExp(`(^[\t]*$\r?\n){${nEL},}`, 'gm');
    }
    formatted = formatted.replace(regex, CRLF);
  }
  // Indentation normalization: replace leading tabs with spaces if configured
  const useSpaces = (config.ReplaceTabToSpaces !== false); // default true
  const indentSize = (typeof config.IndentSize === 'number' && config.IndentSize >= 1 && config.IndentSize <= 10) ? config.IndentSize : 4;
  if (useSpaces) {
    const tabRegex = /^\t+/gm;
    formatted = formatted.replace(tabRegex, (m) => ' '.repeat(m.length * indentSize));
  }
  return formatted;
}

