/** A zero-based UTF-16 offset into a source string. */
export type Offset = number;

/** A zero-based line and UTF-16 character position. */
export interface Position {
	line: number;
	character: number;
}

/** A half-open position range: start is inclusive and end is exclusive. */
export interface Range {
	start: Position;
	end: Position;
}

/** A half-open offset span: start is inclusive and end is exclusive. */
export interface SourceSpan {
	start: Offset;
	end: Offset;
}

/** The equivalent offset and position representations of a source range. */
export interface SourceRange {
	span: SourceSpan;
	range: Range;
}

function assertOffset(source: string, offset: Offset): void {
	if (!Number.isInteger(offset) || offset < 0 || offset > source.length) {
		throw new RangeError(`Offset ${offset} is outside the source.`);
	}
}

function assertPositionPart(name: string, value: number): void {
	if (!Number.isInteger(value) || value < 0) {
		throw new RangeError(`${name} ${value} must be a non-negative integer.`);
	}
}

function getLineStarts(source: string): number[] {
	const starts = [0];
	for (let offset = 0; offset < source.length; offset += 1) {
		if (source[offset] === '\r' && source[offset + 1] === '\n') {
			offset += 1;
			starts.push(offset + 1);
		} else if (source[offset] === '\r' || source[offset] === '\n') {
			starts.push(offset + 1);
		}
	}
	return starts;
}

function getLineContentEnd(source: string, lineStarts: number[], line: number): number {
	if (line + 1 >= lineStarts.length) {
		return source.length;
	}

	let end = lineStarts[line + 1];
	if (source[end - 1] === '\n') {
		end -= 1;
	}
	if (source[end - 1] === '\r') {
		end -= 1;
	}
	return end;
}

/** Convert an offset to a zero-based UTF-16 position. */
export function positionAt(source: string, offset: Offset): Position {
	assertOffset(source, offset);
	const lineStarts = getLineStarts(source);
	let low = 0;
	let high = lineStarts.length;

	while (low + 1 < high) {
		const middle = Math.floor((low + high) / 2);
		if (lineStarts[middle] <= offset) {
			low = middle;
		} else {
			high = middle;
		}
	}

	return { line: low, character: offset - lineStarts[low] };
}

/** Convert a zero-based UTF-16 position to an offset. */
export function offsetAt(source: string, position: Position): Offset {
	assertPositionPart('Line', position.line);
	assertPositionPart('Character', position.character);
	const lineStarts = getLineStarts(source);
	if (position.line >= lineStarts.length) {
		throw new RangeError(`Line ${position.line} is outside the source.`);
	}

	const lineStart = lineStarts[position.line];
	const lineEnd = getLineContentEnd(source, lineStarts, position.line);
	const offset = lineStart + position.character;
	if (offset > lineEnd) {
		throw new RangeError(`Character ${position.character} is outside line ${position.line}.`);
	}
	return offset;
}

/** Create equivalent half-open offset and position ranges for a source span. */
export function sourceRange(source: string, span: SourceSpan): SourceRange {
	assertOffset(source, span.start);
	assertOffset(source, span.end);
	if (span.end < span.start) {
		throw new RangeError('A source span cannot end before it starts.');
	}

	return {
		span: { ...span },
		range: {
			start: positionAt(source, span.start),
			end: positionAt(source, span.end),
		},
	};
}
