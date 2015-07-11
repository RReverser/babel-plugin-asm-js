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

function initialize(heap) {
	var _ref;

	return (_ref = (function asm(stdlib, foreign, heap) {
		"use asm";
		var _Math$log_func = stdlib.Math.log,
		    _Math$exp_func = stdlib.Math.exp;
		var _console$log_func = foreign._console$log_func;

		var values = new global.Float64Array(heap);

		function logSum(start, end) {
			start = start | 0;
			end = end | 0;
			var sum = 0.0,
			    p = 0,
			    q = 0;

			// asm.js forces byte addressing of the heap by requiring shifting by 3
			for (p = start << 3, q = end << 3; p < q; p = p + 8 | 0) {
				sum = sum + +_Math$log_func(values[p >> 3]);
			}

			return +sum;
		}

		function geometricMean(start, end) {
			start = start | 0;
			end = end | 0;

			_console$log_func(start, end);
			return + +_Math$exp_func(+logSum(start, end) / +(end - start | 0));
		}
		return {
			geometricMean: geometricMean
		};
	})(selfGlobal, foreign, heap), _geometricMean = _ref.geometricMean, _ref);
}

// directive
