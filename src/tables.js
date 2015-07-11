import {
	View,
	Intish,
	Double,
	MaybeDouble,
	Float,
	MaybeFloat,
	Floatish,
	Signed,
	Unsigned,
	Int,
	Overloaded,
	Arrow,
	Str
}
from './types';

function dict(obj) {
	var map = new Map();
	for (let key in obj) {
		map.set(key, obj[key]);
	}
	return map;
}

export const HEAP_VIEW_TYPES = dict({
	Int8Array: new View(1, Intish),
	Uint8Array: new View(1, Intish),
	Int16Array: new View(2, Intish),
	Uint16Array: new View(2, Intish),
	Int32Array: new View(4, Intish),
	Uint32Array: new View(4, Intish),
	Float32Array: new View(4, MaybeFloat, new Overloaded([Floatish, MaybeDouble])),
	Float64Array: new View(8, MaybeDouble, new Overloaded([MaybeFloat, MaybeDouble]))
});

var MaybeDoubleToDouble = new Arrow([MaybeDouble], Double);
var MaybeFloatToFloatish = new Arrow([MaybeFloat], Floatish);

var LimitFloatFunc = new Overloaded([
	MaybeDoubleToDouble,
	MaybeFloatToFloatish
]);

var MaybeDoublesToDouble = new Arrow([MaybeDouble, MaybeDouble], Double);

export const STDLIB_TYPES = dict({
	Infinity: Double,
	NaN: Double
});

var minmax = new Overloaded([
	new Arrow([Signed, Signed], Signed),
	new Arrow([MaybeDouble, MaybeDouble], Double)
]);

export const STDLIB_MATH_TYPES = dict({
	acos: MaybeDoubleToDouble,
	asin: MaybeDoubleToDouble,
	atan: MaybeDoubleToDouble,
	cos: MaybeDoubleToDouble,
	sin: MaybeDoubleToDouble,
	tan: MaybeDoubleToDouble,
	ceil: LimitFloatFunc,
	floor: LimitFloatFunc,
	exp: MaybeDoubleToDouble,
	log: MaybeDoubleToDouble,
	sqrt: LimitFloatFunc,
	min: minmax,
	max: minmax,
	abs: new Overloaded([
		new Arrow([Signed], Unsigned),
		MaybeDoubleToDouble,
		MaybeFloatToFloatish
	]),
	atan2: MaybeDoublesToDouble,
	pow: MaybeDoublesToDouble,
	imul: new Arrow([Int, Int], Signed),
	E: Double,
	LN10: Double,
	LN2: Double,
	LOG2E: Double,
	LOG10E: Double,
	PI: Double,
	SQRT1_2: Double,
	SQRT2: Double
});

var SignedBitwise = new Overloaded([ new Arrow([Intish, Intish], Signed) ]);

var RelOp = new Overloaded([
	new Arrow([Signed, Signed], Int),
	new Arrow([Unsigned, Unsigned], Int),
	new Arrow([Double, Double], Int),
	new Arrow([Float, Float], Int)
]);

export const BINOPS = dict({
	'+': new Overloaded([
		new Arrow([Intish, Intish], Intish), // added to comply with 6.8.9
		new Arrow([MaybeDouble, MaybeDouble], Double),
		new Arrow([MaybeFloat, MaybeFloat], Floatish)
	]),
	'-': new Overloaded([
		new Arrow([Intish, Intish], Intish), // added to comply with 6.8.9
		new Arrow([MaybeDouble, MaybeDouble], Double),
		new Arrow([MaybeFloat, MaybeFloat], Floatish)
	]),
	'*': new Overloaded([
		new Arrow([MaybeDouble, MaybeDouble], Double),
		new Arrow([MaybeFloat, MaybeFloat], Floatish)
	]),
	'/': new Overloaded([
		new Arrow([Signed, Signed], Intish),
		new Arrow([Unsigned, Unsigned], Intish),
		new Arrow([MaybeDouble, MaybeDouble], Double),
		new Arrow([MaybeFloat, MaybeFloat], Floatish)
	]),
	'%': new Overloaded([
		new Arrow([Signed, Signed], Intish),
		new Arrow([Unsigned, Unsigned], Intish),
		new Arrow([MaybeDouble, MaybeDouble], Double)
	]),
	'|': SignedBitwise,
	'&': SignedBitwise,
	'^': SignedBitwise,
	'<<': SignedBitwise,
	'>>': SignedBitwise,
	'>>>': new Overloaded([ new Arrow([Intish, Intish], Unsigned) ]),
	'<': RelOp,
	'<=': RelOp,
	'>': RelOp,
	'>=': RelOp,
	'==': RelOp,
	'!=': RelOp
});

export const UNOPS = dict({
	'+': new Overloaded([
		new Arrow([Signed], Double),
		new Arrow([Unsigned], Double),
		new Arrow([MaybeDouble], Double),
		new Arrow([MaybeFloat], Double)
	]),
	'-': new Overloaded([
		new Arrow([Int], Intish),
		MaybeDoubleToDouble,
		MaybeFloatToFloatish
	]),
	'~': new Overloaded([ new Arrow([Intish], Signed) ]),
	'!': new Overloaded([ new Arrow([Int], Int) ])
});
