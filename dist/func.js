'use strict';

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

Object.defineProperty(exports, '__esModule', {
	value: true
});
exports['default'] = visit;

var _util = require('./util');

var _types = require('./types');

var _tables = require('./tables');

var LIMIT_FIXNUM = 1 << 31 >>> 0;
var LIMIT_UNSIGNED = Math.pow(2, 32);

var funcVisitor = {
	SequenceExpression: {
		exit: function SequenceExpression(node, parent, scope, state) {
			var expressions = this.get('expressions');
			this.setData('asmType', (0, _util.validateType)(expressions[expressions.length - 1], state.type));
		}
	},

	UnaryExpression: {
		exit: function UnaryExpression(node, parent, scope, state) {
			var opTypes = _tables.UNOPS.get(node.operator).alts;
			var argType = this.get('argument').getData('asmType');
			for (var _iterator = opTypes, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _getIterator(_iterator);;) {
				var _ref;

				if (_isArray) {
					if (_i >= _iterator.length) break;
					_ref = _iterator[_i++];
				} else {
					_i = _iterator.next();
					if (_i.done) break;
					_ref = _i.value;
				}

				var type = _ref;

				if (argType.subtype(type.params[0])) {
					this.setData('asmType', type.result);
					return;
				}
			}
			_util.typeError.call(this, 'Unsupported operation: ' + node.operator + ' ' + argType);
		}
	},

	BinaryExpression: {
		exit: function BinaryExpression(node, parent, scope, state) {
			var opTypes = _tables.BINOPS.get(node.operator).alts;
			var leftType = this.get('left').getData('asmType');
			var rightType = this.get('right').getData('asmType');
			for (var _iterator2 = opTypes, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _getIterator(_iterator2);;) {
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

				if (leftType.subtype(type.params[0]) && rightType.subtype(type.params[1])) {
					this.setData('asmType', type.result);
					return;
				}
			}
			_util.typeError.call(this, 'Unsupported operation: ' + leftType + ' ' + node.operator + ' ' + rightType);
		}
	},

	Literal: function Literal(node) {
		var value = node.value;

		_util.assert.call(this, typeof value === 'number', 'only numeric literals are supported');
		if (node.raw.indexOf('.') < 0) {
			if (value < LIMIT_FIXNUM) {
				this.setData('asmType', _types.Fixnum);
				return;
			}
			if (value < LIMIT_UNSIGNED) {
				this.setData('asmType', _types.Unsigned);
				return;
			}
			node.raw += '.0';
		}
		this.setData('asmType', _types.Double);
	},

	ReferencedIdentifier: function ReferencedIdentifier(node, parent, scope, state) {
		var binding = scope.getBinding(node.name);
		if (binding) {
			this.setData('asmType', binding.path.getData('asmType'));
		} else {
			state.program['import'](this);
		}
	},

	MemberExpression: function MemberExpression(node, parent, scope, state) {
		if (state.program['import'](this)) {
			this.skip();
		}
	},

	ReturnStatement: {
		exit: function ReturnStatement(node, parent, scope, state) {
			var _context;

			if (state.returnType === 'void') {
				var arg = node.argument;
				if (arg === null) {
					return;
				}
				return [state.t.expressionStatement(arg), node];
			}
			node.argument = (_context = this.get('argument'), _util.wrap).call(_context, state.returnType, true);
		}
	},

	VariableDeclarator: {
		exit: function VariableDeclarator(node, parent, scope, state) {
			var init = this.get('init');
			var asmType = init.getData('asmType');
			this.setData('asmType', asmType);
			state.vars.push(node);
			if (node.init.type === 'Literal' && node.init.value === 0) {
				return this.dangerouslyRemove();
			}
			node.init = state.t.literal(0);
			if (!asmType.subtype(_types.Intish)) {
				node.init.raw = '0.0';
			}
			return state.t.assignmentExpression('=', node.id, init.node);
		}
	},

	VariableDeclaration: {
		enter: function VariableDeclaration(node) {
			_util.assert.call(this, node.kind === 'var', 'only var declarations are currently supported');
		},
		exit: function VariableDeclaration(node, parent, scope, state) {
			var expr = state.t.sequenceExpression(node.declarations);
			if (parent.type === 'ForStatement') {
				return expr;
			}
			return state.t.expressionStatement(expr);
		}
	},

	AssignmentExpression: {
		exit: function AssignmentExpression(node, parent, scope, state) {
			var asmType = scope.getBinding(node.left.name).path.getData('asmType');
			var right = this.get('right');
			right.replaceWith(_util.wrap.call(right, asmType));
		}
	},

	CallExpression: {
		exit: function CallExpression(node, parent, scope, state) {
			var callee = this.get('callee');
			_util.assert.call(callee, callee.node.type === 'Identifier', 'only calls to direct identifiers are possible');
			var resultType = callee.getData('asmType').result;
			this.setData('asmType', resultType);
			this.replaceWith(_util.wrap.call(this, resultType, true));
		}
	}
};

var FuncState = function FuncState(programState, returnType) {
	_classCallCheck(this, FuncState);

	this.t = programState.t;
	this.program = programState;
	this.returnType = returnType;
	this.vars = [];
};

function visit(programState) {
	var _context3;

	var paramTypes = [];
	var wrappedParams = this.get('params').map(function (param) {
		var _context2;

		var asmType = (_context2 = param.get('typeAnnotation'), _util.flowToAsm).call(_context2);
		param.setData('asmType', asmType);
		paramTypes.push(asmType);
		var node = param.node;

		return programState.t.expressionStatement(programState.t.assignmentExpression('=', node, _util.wrap.call(param, asmType, true)));
	});
	var returnType = (_context3 = this.get('returnType'), _util.flowToAsm).call(_context3);
	this.setData('asmType', new _types.Arrow(paramTypes, returnType));
	var funcState = new FuncState(programState, returnType);
	this.get('body').traverse(funcVisitor, funcState);
	if (funcState.vars.length) {
		this.get('body.body.0').insertBefore(programState.t.variableDeclaration('var', funcState.vars));
	}
	this.get('body.body.0').insertBefore(wrappedParams);
	programState.funcs.push(this.node);
}

module.exports = exports['default'];