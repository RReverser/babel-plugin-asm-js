'use strict';

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Map = require('babel-runtime/core-js/map')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
	value: true
});
exports['default'] = visit;

var _util = require('./util');

var _func = require('./func');

var _func2 = _interopRequireDefault(_func);

var _tables = require('./tables');

var _types = require('./types');

var programVisitor = {
	FunctionDeclaration: function FunctionDeclaration(node, parent, scope, state) {
		this.skip();
		_func2['default'].call(this, state);
	},

	ExportNamedDeclaration: function ExportNamedDeclaration(node, parent, scope, state) {
		state['export'](this);
	},

	ExportDefaultDeclaration: function ExportDefaultDeclaration(node, parent, scope, state) {
		state['export'](this, 'default');
	},

	ImportDeclaration: function ImportDeclaration(node, parent, scope, state) {
		this.skip();
		state.outside.push(node);
	},

	VariableDeclaration: function VariableDeclaration(node, parent, scope, state) {
		state.varDecls.push(node);
	}
};

var ProgramState = (function () {
	function ProgramState(types) {
		_classCallCheck(this, ProgramState);

		this.t = types;
		this.outside = [];
		this.stdlibImports = new _Map();
		this.foreignImports = new _Map();
		this.varDecls = [];
		this.funcs = [];
		this.funcTables = [];
		this.exports = new _Map();
	}

	ProgramState.prototype['import'] = function _import(ref) {
		var path = [],
		    onlyIds = true;
		var fullRef = ref;
		for (; ref.isMemberExpression(); ref = ref.get('object')) {
			var property = ref.get('property');
			var propName = undefined;
			if (ref.is('computed')) {
				onlyIds = false;
				propName = property.node.value;
			} else {
				propName = property.node.name;
			}
			path.unshift(propName);
		}
		_util.assert.call(ref, ref.isIdentifier(), 'root object should be an identifier');
		if (ref.scope.hasBinding(ref.node.name, true)) {
			return;
		}
		_util.assert.call(fullRef, onlyIds, 'computed properties are not allowed');
		path.unshift(ref.node.name);
		var topPath = path[0];
		if (topPath === 'global') {
			path.shift();
			topPath = path[0];
		}
		var kind, map;
		if (topPath === 'Math' || _util.GLOBALS.has(topPath)) {
			kind = 'stdlib';
			map = this.stdlibImports;
		} else {
			kind = 'foreign';
			map = this.foreignImports;
		}
		var importName = path.join('$');
		var importRec = map.get(importName);
		if (!importRec) {
			var asmType = undefined;
			if (kind === 'stdlib') {
				if (topPath === 'Math') {
					_util.assert.call(ref, path.length === 2, 'too long path');
					asmType = _tables.STDLIB_MATH_TYPES.get(path[1]);
					_util.assert.call(ref, asmType, 'unknown Math property');
				} else {
					asmType = _util.GLOBALS.get(topPath);
				}
			} else {
				asmType = _types.Func;
			}
			importRec = {
				kind: kind,
				uid: ref.scope.generateUidIdentifier(importName),
				expr: fullRef.node,
				type: asmType
			};
			map.set(importName, importRec);
		}
		fullRef.replaceWith(importRec.uid);
		fullRef.setData('asmType', importRec.type);
	};

	ProgramState.prototype['export'] = function _export(ref, exportedName) {
		var func = ref.get('declaration');
		_util.assert.call(ref, func.isFunctionDeclaration(), 'only immediate function declarations are supported');
		var id = func.get('id').node;
		if (exportedName === undefined) {
			exportedName = id.name;
		}
		this.exports.set(exportedName, {
			uid: ref.scope.generateUidIdentifier(exportedName),
			local: id,
			exported: { type: 'Identifier', name: exportedName }
		});
	};

	return ProgramState;
})();

exports.ProgramState = ProgramState;

function visit(state) {
	this.traverse(programVisitor, state);
}