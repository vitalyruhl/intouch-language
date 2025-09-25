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
  FormatAlsoInComment?: boolean;
}

// --- Pure copy of original forFormat logic (minus vscode logging) ---
export function forFormat(text: string, config: FormatterConfig): string {
  let txt = text.split("");
  let buf: string = "";
  let modified: number = 0;
  let inComment = false;
  let inString = false;
  let LineCount = 1;
  let ColumnCount = 0;

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
          // Keywords
            for (let kw of KEYWORDS) {
              const slice = text.substr(i, kw.length);
              const before = text[i - 1];
              const after = text[i + kw.length];
              if (slice.toLowerCase() === kw.toLowerCase()) {
                if (CheckCRLForWhitespace(before) && CheckCRLForWhitespace(after)) {
                  const out = kw.toUpperCase() + after;
                  buf += out;
                  modified = out.length - 1;
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
          // Single operators
          if (!(modified > 0)) {
            for (let op of SINGLE_OPERATORS) {
              if (txt[i] === op) {
                if (op === '-') {
                  const tstSwp = text[i + 1] == ' ' && text[i - 1] != ' ';
                  if (tstSwp) buf += ' ';
                } else if (text[i - 1] != ' ') {
                  buf += ' ';
                }
                buf += txt[i];
                if (text[i + 1] != ' ') {
                  if (op === '-') {
                    // no space after minus if negative number
                  } else if (op === '+') {
                    if (isNaN(+text[i + 1])) buf += ' ';
                  } else {
                    buf += ' ';
                  }
                }
                modified = -1;
                break;
              }
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
  let normalized = buf
    .replace(/\s+;/g, ';')
    .split(CRLF)
    .map(line => line.replace(/\s+$/g, ''))
    .join(CRLF);
  return normalized;
}

// --- Pure copy of formatNestings (stripped logging & vscode deps) ---
export function formatNestings(text: string, config: FormatterConfig): string {
  let buf = "";
  let codeFragments: string[] = [];
  let regex = "";
  let nestingCounter = 0;
  let nestingCounterPrevious = 0;
  let multilineComment = false;
  let thisLineBack = false;
  let regexCB = `^${config.BlockCodeBegin}`;
  let regexCEx = `^${config.BlockCodeExclude}`;
  let regexCE = `^${config.BlockCodeEnd}`;
  let regexRegionCB = `^${config.RegionBlockCodeBegin}`;
  let regexRegionCEx = `^${config.RegionBlockCodeExclude}`;
  let regexRegionCE = `^${config.RegionBlockCodeEnd}`;
  const hadFinalCRLF = text.endsWith(CRLF);
  codeFragments = text.split(CRLF);
  for (let i = 0; i < codeFragments.length; i++) {
    let isEmptyLine = false;
    codeFragments[i] = codeFragments[i].replace(/\s+$/g, "");
    if (codeFragments[i] === "") isEmptyLine = true;
    if (codeFragments[i].search(REGEX.g_CHECK_OPEN_COMMENT) !== -1) multilineComment = true;
    if (codeFragments[i].search(REGEX.g_CHECK_CLOSE_COMMENT) !== -1) multilineComment = false;
    let str = codeFragments[i].match(REGEX.gm_GET_STRING);
    if (str) {
      let str2 = str.map((item) => {
        let strw = item.replace(/\s(?<!\t)/gim, "\0");
        strw = strw.replace(/\t/gim, "u0001");
        return codeFragments[i].replace(item, strw);
      });
      codeFragments[i] = str2[0].replace(REGEX.gm_MOR_2_WSP, " ");
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
      codeFragments[i] = codeFragments[i].replace(/\0/gim, ' ').replace(/u0001/gim, '\t');
    }
    if (!isEmptyLine && !multilineComment) {
      let exclude = false;
      codeFragments[i] = codeFragments[i].replace(REGEX.gm_GET_NESTING, "");
      if (codeFragments[i].search(new RegExp(regexCB, 'gi')) !== -1) { nestingCounter++; thisLineBack = true; }
      else if (codeFragments[i].search(new RegExp(regexCEx, 'gi')) !== -1) { thisLineBack = true; }
      else if (codeFragments[i].search(new RegExp(regexCE, 'gi')) !== -1) {
        nestingCounter--; thisLineBack = true; if (nestingCounter < 0) { nestingCounter = 0; thisLineBack = false; }
      }
      else if (codeFragments[i].search(new RegExp(regexRegionCB, 'gi')) !== -1) { nestingCounter++; thisLineBack = true; }
      else if (codeFragments[i].search(new RegExp(regexRegionCEx, 'gi')) !== -1) { thisLineBack = true; }
      else if (codeFragments[i].search(new RegExp(regexRegionCE, 'gi')) !== -1) {
        nestingCounter--; thisLineBack = true; if (nestingCounter < 0) { nestingCounter = 0; thisLineBack = false; }
      } else {
        EXCLUDE_KEYWORDS.some(item => {
          regex = `((?![^{]*})(${item}))`;
          if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) exclude = true;
        });
        let keyFound = false;
        for (let n of NESTINGS) {
          if (!exclude) {
            regex = `((?![^{]*})(\\b${n.keyword})\\b)`;
            if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) { nestingCounter++; keyFound = true; }
          }
          if (n.multiline !== '') {
            regex = `((?![^{]*})(\\b${n.multiline})\\b)`;
            if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) { if (!keyFound) thisLineBack = true; }
          }
          if (n.middle !== '') {
            regex = `((?![^{]*})(\\b${n.middle})\\b)`;
            if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) { thisLineBack = true; break; }
          }
          regex = `((?![^{]*})(\\b${n.end})\\b)`;
            if (codeFragments[i].search(new RegExp(regex, 'i')) !== -1) {
              nestingCounter--; if (nestingCounter < 0) { nestingCounter = 0; thisLineBack = false; }
              thisLineBack = true; break;
            }
          keyFound = false;
        }
      }
    }
    if (!isEmptyLine) {
      const prefix = getNesting(nestingCounterPrevious, thisLineBack);
      codeFragments[i] = prefix + codeFragments[i];
      if (nestingCounterPrevious !== nestingCounter) nestingCounterPrevious = nestingCounter;
      thisLineBack = false;
    }
  }
  for (let i = 0; i < codeFragments.length; i++) {
    const isLast = i === codeFragments.length - 1;
    if (!isLast) buf += codeFragments[i] + CRLF; else {
      if (codeFragments[i] !== '') { buf += codeFragments[i]; if (hadFinalCRLF) buf += CRLF; }
    }
  }
  return buf;
}

function getNesting(n: number, thisLineBack: boolean): string {
  let temp = "";
  if (n !== 0) {
    for (let i = 0; i < n; i++) {
      if (thisLineBack) { thisLineBack = false; } else { temp += TAB; }
    }
  }
  return temp;
}

function CheckCRLForWhitespace(s: string): boolean {
  return FORMATS.concat(SINGLE_OPERATORS, DOUBLE_OPERATORS, TRENNER).some(item => s === item);
}

export function pureFormatPipeline(text: string, config: FormatterConfig) {
  let formatted = forFormat(text, config);
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
  return formatted;
}
