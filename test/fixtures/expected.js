"use strict";

var _selfGlobal = require("babel-runtime/helpers/self-global")["default"];

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports["default"] = initialize;

var selfGlobal = _selfGlobal(),
    foreign = {
	_console$log_func: function _console$log_func() {
		return console.log.apply(console, arguments);
	}
},
    strings = [];

var _geometricMean;

exports._geometricMean = _geometricMean;

function asm(stdlib, foreign, heap) {
	"use asm";
	var _Math$log = stdlib.Math.log,
	    _Math$exp = stdlib.Math.exp;
	var _console$log_func = foreign._console$log_func;

	var values = new Float64Array(heap);

	function logSum(start, end) {
		start = start | 0;
		end = end | 0;
		var sum = 0.0,
		    _p = 0,
		    _q = 0;

		// asm.js forces byte addressing of the heap by requiring shifting by 3
		for (_p = start << 3, _q = end << 3; _p < _q; _p = _p + 8 | 0) {
			sum = sum + +_Math$log(values[_p >> 3]);
		}

		return +sum;
	}

	function geometricMean(start, end) {
		start = start | 0;
		end = end | 0;

		_console$log_func(start, end);
		return + +_Math$exp(+logSum(start, end) / +(end - start | 0));
	}
	return {
		geometricMean: geometricMean
	};
}

function initialize(heap) {
	var _asm;

	return (_asm = asm(selfGlobal, foreign, heap), _geometricMean = _asm.geometricMean, _asm);
}

// directive
