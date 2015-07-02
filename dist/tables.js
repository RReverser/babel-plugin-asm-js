'use strict';

var _Map = require('babel-runtime/core-js/map')['default'];

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _types = require('./types');

function dict(obj) {
	var map = new _Map();
	for (var key in obj) {
		map.set(key, obj[key]);
	}
	return map;
}

var HEAP_VIEW_TYPES = dict({
	Int8Array: new _types.View(1, _types.Intish),
	Uint8Array: new _types.View(1, _types.Intish),
	Int16Array: new _types.View(2, _types.Intish),
	Uint16Array: new _types.View(2, _types.Intish),
	Int32Array: new _types.View(4, _types.Intish),
	Uint32Array: new _types.View(4, _types.Intish),
	Float32Array: new _types.View(4, _types.MaybeFloat, new _types.Overloaded([_types.Floatish, _types.MaybeDouble])),
	Float64Array: new _types.View(8, _types.MaybeDouble, new _types.Overloaded([_types.MaybeFloat, _types.MaybeDouble]))
});

exports.HEAP_VIEW_TYPES = HEAP_VIEW_TYPES;
var MaybeDoubleToDouble = new _types.Arrow([_types.MaybeDouble], _types.Double);
var MaybeFloatToFloatish = new _types.Arrow([_types.MaybeFloat], _types.Floatish);

var LimitFloatFunc = new _types.Overloaded([MaybeDoubleToDouble, MaybeFloatToFloatish]);

var MaybeDoublesToDouble = new _types.Arrow([_types.MaybeDouble, _types.MaybeDouble], _types.Double);

var STDLIB_TYPES = dict({
	Infinity: _types.Double,
	NaN: _types.Double
});

exports.STDLIB_TYPES = STDLIB_TYPES;
var minmax = new _types.Overloaded([new _types.Arrow([_types.Signed, _types.Signed], _types.Signed), new _types.Arrow([_types.MaybeDouble, _types.MaybeDouble], _types.Double)]);

var STDLIB_MATH_TYPES = dict({
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
	abs: new _types.Overloaded([new _types.Arrow([_types.Signed], _types.Unsigned), MaybeDoubleToDouble, MaybeFloatToFloatish]),
	atan2: MaybeDoublesToDouble,
	pow: MaybeDoublesToDouble,
	imul: new _types.Arrow([_types.Int, _types.Int], _types.Signed),
	E: _types.Double,
	LN10: _types.Double,
	LN2: _types.Double,
	LOG2E: _types.Double,
	LOG10E: _types.Double,
	PI: _types.Double,
	SQRT1_2: _types.Double,
	SQRT2: _types.Double
});

exports.STDLIB_MATH_TYPES = STDLIB_MATH_TYPES;
var SignedBitwise = new _types.Overloaded([new _types.Arrow([_types.Intish, _types.Intish], _types.Signed)]);

var RelOp = new _types.Overloaded([new _types.Arrow([_types.Signed, _types.Signed], _types.Int), new _types.Arrow([_types.Unsigned, _types.Unsigned], _types.Int), new _types.Arrow([_types.Double, _types.Double], _types.Int), new _types.Arrow([_types.Float, _types.Float], _types.Int)]);

var BINOPS = dict({
	'+': new _types.Overloaded([new _types.Arrow([_types.Intish, _types.Intish], _types.Intish), // added to comply with 6.8.9
	new _types.Arrow([_types.MaybeDouble, _types.MaybeDouble], _types.Double), new _types.Arrow([_types.MaybeFloat, _types.MaybeFloat], _types.Floatish)]),
	'-': new _types.Overloaded([new _types.Arrow([_types.Intish, _types.Intish], _types.Intish), // added to comply with 6.8.9
	new _types.Arrow([_types.MaybeDouble, _types.MaybeDouble], _types.Double), new _types.Arrow([_types.MaybeFloat, _types.MaybeFloat], _types.Floatish)]),
	'*': new _types.Overloaded([new _types.Arrow([_types.MaybeDouble, _types.MaybeDouble], _types.Double), new _types.Arrow([_types.MaybeFloat, _types.MaybeFloat], _types.Floatish)]),
	'/': new _types.Overloaded([new _types.Arrow([_types.Signed, _types.Signed], _types.Intish), new _types.Arrow([_types.Unsigned, _types.Unsigned], _types.Intish), new _types.Arrow([_types.MaybeDouble, _types.MaybeDouble], _types.Double), new _types.Arrow([_types.MaybeFloat, _types.MaybeFloat], _types.Floatish)]),
	'%': new _types.Overloaded([new _types.Arrow([_types.Signed, _types.Signed], _types.Intish), new _types.Arrow([_types.Unsigned, _types.Unsigned], _types.Intish), new _types.Arrow([_types.MaybeDouble, _types.MaybeDouble], _types.Double)]),
	'|': SignedBitwise,
	'&': SignedBitwise,
	'^': SignedBitwise,
	'<<': SignedBitwise,
	'>>': SignedBitwise,
	'>>>': new _types.Overloaded([new _types.Arrow([_types.Intish, _types.Intish], _types.Unsigned)]),
	'<': RelOp,
	'<=': RelOp,
	'>': RelOp,
	'>=': RelOp,
	'==': RelOp,
	'!=': RelOp
});

exports.BINOPS = BINOPS;
var UNOPS = dict({
	'+': new _types.Overloaded([new _types.Arrow([_types.Signed], _types.Double), new _types.Arrow([_types.Unsigned], _types.Double), new _types.Arrow([_types.MaybeDouble], _types.Double), new _types.Arrow([_types.MaybeFloat], _types.Double)]),
	'-': new _types.Overloaded([new _types.Arrow([_types.Int], _types.Intish), MaybeDoubleToDouble, MaybeFloatToFloatish]),
	'~': new _types.Overloaded([new _types.Arrow([_types.Intish], _types.Signed)]),
	'!': new _types.Overloaded([new _types.Arrow([_types.Int], _types.Int)])
});
exports.UNOPS = UNOPS;