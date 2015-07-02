"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _stuff = require("./stuff");

var _stuff2 = _interopRequireDefault(_stuff);

var exports = (function asm(stdlib, foreign, heap) {
	"use asm";
	var _Math$log = stdlib.Math.log,
	    _Math$exp = stdlib.Math.exp;
	var _console$log = foreign._console$log;

	var values = new global.Float64Array(heap);

	function logSum(start, end) {
		start = start | 0;
		end = end | 0;
		var sum = 0.0,
		    p = 0,
		    q = 0;

		// asm.js forces byte addressing of the heap by requiring shifting by 3
		for (p = start << 3, q = end << 3; p < q; p = p + 8 | 0) {
			sum = sum + +_Math$log(values[p >> 3]);
		}

		return +sum;
	}

	function geometricMean(start, end) {
		start = start | 0;
		end = end | 0;
		var ;

		_console$log(start, end);
		return + +_Math$exp(+logSum(start, end) / +(end - start | 0));
	}
	return {
		geometricMean: geometricMean
	};
})(typeof self !== "undefined" ? self : global, {
	_console$log: console.log
}, new ArrayBuffer(0x10000));

var _geometricMean = exports.geometricMean;
exports.geometricMean = _geometricMean;
// directive
