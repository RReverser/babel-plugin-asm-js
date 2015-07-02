'use strict';

var _toConsumableArray = require('babel-runtime/helpers/to-consumable-array')['default'];

var _Map = require('babel-runtime/core-js/map')['default'];

Object.defineProperty(exports, '__esModule', {
	value: true
});
exports.typeError = typeError;
exports.assert = assert;
exports.flowToAsm = flowToAsm;
exports.wrap = wrap;
exports.validateType = validateType;

var _tables = require('./tables');

var _types = require('./types');

var GLOBALS = new _Map([].concat(_toConsumableArray(_tables.STDLIB_TYPES.entries()), _toConsumableArray(_tables.HEAP_VIEW_TYPES.entries())));

exports.GLOBALS = GLOBALS;

function typeError(msg) {
	throw this.errorWithNode(msg, TypeError);
}

function assert(cond, msg) {
	if (!cond) {
		typeError.call(this, 'Assertion failed: ' + msg);
	}
}

var flowToAsmMappings = {
	int: _types.Int,
	double: _types.Double,
	float: _types.Float
};

function flowToAsm() {
	var annotation = this.get('typeAnnotation');
	assert.call(this, annotation.type === 'GenericTypeAnnotation', 'only generic type annotations are accepted');
	var type = annotation.node.id.name;
	assert.call(this, type in flowToAsmMappings, 'unknown type ' + type);
	return flowToAsmMappings[type];
}

function wrap(type, force) {
	var node = this.node;

	if (!force) {
		var asmType = this.getData('asmType');
		if (asmType.subtype(type)) {
			return node;
		}
	}
	if (type.subtype(_types.Int)) {
		return {
			type: 'BinaryExpression',
			left: node,
			operator: '|',
			right: { type: 'Literal', value: 0 }
		};
	}
	if (type.subtype(_types.Double)) {
		return {
			type: 'UnaryExpression',
			operator: '+',
			argument: node
		};
	}
	if (type.subtype(_types.Float)) {
		return {
			type: 'CallExpression',
			callee: {
				type: 'MemberExpression',
				object: { type: 'Identifier', name: 'Math' },
				property: { type: 'Identifier', name: 'fround' }
			},
			arguments: [node]
		};
	}
	if (type.subtype(_types.Extern)) {
		return node;
	}
	typeError.call(this, 'can\'t wrap into type ' + type);
}

function validateType(path, expectedType) {
	var type = path.getData('asmType');
	if (expectedType !== undefined) {
		assert.call(path, type.subtype(expectedType), 'expected ' + expectedType + ' but got ' + type);
	}
	return type;
}