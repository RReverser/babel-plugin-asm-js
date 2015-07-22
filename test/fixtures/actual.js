// directive
"use asm";

type int = number;
type double = number;
type float = number;

import stuff from './stuff';

var values = new Float64Array(heap);

function logSum(start: int, end: int): double {
	var sum = 0.0;

	// asm.js forces byte addressing of the heap by requiring shifting by 3
	for (let p = start << 3, q = end << 3; p < q; p = p + 8) {
		sum = sum + Math.log(values[p>>3]);
	}

	return sum;
}

export function geometricMean(start: int, end: int): double {
	console.log(start, end);
	return Math.exp(logSum(start, end) / (end - start: double));
}
