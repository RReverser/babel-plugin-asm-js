'use strict';

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _Set = require('babel-runtime/core-js/set')['default'];

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

Object.defineProperty(exports, '__esModule', {
	value: true
});

var Type = (function () {
	function Type() {
		_classCallCheck(this, Type);
	}

	Type.prototype.equals = function equals(other) {
		return this === other;
	};

	Type.prototype.subtype = function subtype(other) {
		return this === other;
	};

	return Type;
})();

// =============================================================================
// Value Types
// =============================================================================

var ValueType = (function (_Type) {
	function ValueType(name) {
		var supertypes = arguments[1] === undefined ? [] : arguments[1];

		_classCallCheck(this, ValueType);

		_Type.call(this);
		this.name = name;
		this.supertypes = new _Set([this]);
		for (var _iterator = supertypes, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _getIterator(_iterator);;) {
			var _ref;

			if (_isArray) {
				if (_i >= _iterator.length) break;
				_ref = _iterator[_i++];
			} else {
				_i = _iterator.next();
				if (_i.done) break;
				_ref = _i.value;
			}

			var directSuper = _ref;

			for (var _iterator2 = directSuper.supertypes, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _getIterator(_iterator2);;) {
				var _ref2;

				if (_isArray2) {
					if (_i2 >= _iterator2.length) break;
					_ref2 = _iterator2[_i2++];
				} else {
					_i2 = _iterator2.next();
					if (_i2.done) break;
					_ref2 = _i2.value;
				}

				var type = _ref2;

				this.supertypes.add(type);
			}
		}
	}

	_inherits(ValueType, _Type);

	ValueType.prototype.subtype = function subtype(other) {
		return this.supertypes.has(other);
	};

	ValueType.prototype.toString = function toString() {
		return this.name;
	};

	return ValueType;
})(Type);

exports.ValueType = ValueType;
var Floatish = new ValueType('floatish');

exports.Floatish = Floatish;
var MaybeFloat = new ValueType('float?', [Floatish]);

exports.MaybeFloat = MaybeFloat;
var Float = new ValueType('float', [MaybeFloat]);

exports.Float = Float;
var Intish = new ValueType('intish');

exports.Intish = Intish;
var Int = new ValueType('int', [Intish]);

exports.Int = Int;
var Extern = new ValueType('extern');

exports.Extern = Extern;
var Signed = new ValueType('signed', [Extern, Int]);

exports.Signed = Signed;
var Unsigned = new ValueType('unsigned', [Extern, Int]);

exports.Unsigned = Unsigned;
var MaybeDouble = new ValueType('double?');

exports.MaybeDouble = MaybeDouble;
var Double = new ValueType('double', [Extern, MaybeDouble]);

exports.Double = Double;
var Fixnum = new ValueType('fixnum', [Signed, Unsigned]);

exports.Fixnum = Fixnum;
var Void = new ValueType('void');

exports.Void = Void;
// =============================================================================
// Global Types
// =============================================================================

// ([ValueType], ValueType) -> Arrow

var Arrow = (function (_Type2) {
	function Arrow(params, result) {
		_classCallCheck(this, Arrow);

		_Type2.call(this);
		this.params = params;
		this.result = result;
	}

	_inherits(Arrow, _Type2);

	Arrow.prototype.equals = function equals(other) {
		return other instanceof Arrow && this.params.length === other.params.length && this.params.every(function (p, i) {
			return p.equals(other.params[i]);
		}) && this.result.equals(other.result);
	};

	Arrow.prototype.toString = function toString() {
		return '(' + this.params.join(', ') + ') => ' + this.result;
	};

	return Arrow;
})(Type);

exports.Arrow = Arrow;

// ([Arrow]) -> Overloaded

var Overloaded = (function (_Type3) {
	function Overloaded(alts) {
		_classCallCheck(this, Overloaded);

		_Type3.call(this);
		this.alts = alts;
	}

	_inherits(Overloaded, _Type3);

	Overloaded.prototype.toString = function toString() {
		return this.alts.join(' | ');
	};

	return Overloaded;
})(Type);

exports.Overloaded = Overloaded;

// (1|2|4|8, ValueType) -> View

var View = (function (_Type4) {
	function View(bytes, loadType) {
		var storeType = arguments[2] === undefined ? loadType : arguments[2];
		return (function () {
			_classCallCheck(this, View);

			_Type4.call(this);
			this.bytes = bytes;
			this.loadType = loadType;
			this.storeType = storeType;
		}).apply(this, arguments);
	}

	_inherits(View, _Type4);

	View.prototype.toString = function toString() {
		var loadType = this.loadType;
		var storeType = this.storeType;

		var ext = loadType === storeType ? loadType : 'load: ' + loadType + ', store: ' + storeType;
		return 'View<' + this.bytes + ', ext)>';
	};

	return View;
})(Type);

exports.View = View;

// (Arrow, integer) -> Table

var Table = (function (_Type5) {
	function Table(type, length) {
		_classCallCheck(this, Table);

		_Type5.call(this);
		this.type = type;
		this.length = length;
	}

	_inherits(Table, _Type5);

	Table.prototype.toString = function toString() {
		return '(' + this.type + ')[' + this.length + ']';
	};

	return Table;
})(Type);

exports.Table = Table;

var ExternFunc = (function (_Type6) {
	function ExternFunc() {
		_classCallCheck(this, ExternFunc);

		_Type6.apply(this, arguments);
	}

	_inherits(ExternFunc, _Type6);

	ExternFunc.prototype.toString = function toString() {
		return 'Function';
	};

	return ExternFunc;
})(Type);

ExternFunc.prototype.result = Extern;

var Func = new ExternFunc();

exports.Func = Func;

var Module = (function (_Type7) {
	function Module() {
		_classCallCheck(this, Module);

		_Type7.apply(this, arguments);
	}

	_inherits(Module, _Type7);

	return Module;
})(Type);

exports.Module = Module;

var ModuleParameter = (function (_Type8) {
	function ModuleParameter() {
		_classCallCheck(this, ModuleParameter);

		_Type8.apply(this, arguments);
	}

	_inherits(ModuleParameter, _Type8);

	return ModuleParameter;
})(Type);

exports.ModuleParameter = ModuleParameter;