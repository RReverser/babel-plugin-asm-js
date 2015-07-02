'use strict';

var _Array$from = require('babel-runtime/core-js/array/from')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

require('better-log/install');

var _estemplate = require('estemplate');

var _program = require('./program');

var _program2 = _interopRequireDefault(_program);

var tmplAsm = (0, _estemplate.compile)('%= outside %;\nvar exports = (function asm(stdlib, foreign, heap) {\n\t"use asm";\n\t%= stdlibImports.declarations.length ? stdlibImports : { type: \'EmptyStatement\' } %;\n\t%= foreignImports.declarations.length ? foreignImports : { type: \'EmptyStatement\' } %;\n\t%= varDecls %;\n\t%= funcs %;\n\t%= funcTables %;\n\treturn <%= exports %>;\n})(typeof self !== "undefined" ? self : global, <%= foreign %>, new ArrayBuffer(0x10000));\n%= exportOutside %;');

module.exports = function (_ref) {
	var Transformer = _ref.Transformer;
	var t = _ref.types;
	var parse = _ref.parse;

	function reattach(member, newRoot) {
		if (t.isIdentifier(member)) {
			return t.memberExpression(newRoot, member);
		}
		return t.memberExpression(reattach(member.object, newRoot), member.property);
	}

	return new Transformer('asm-js', {
		Program: function Program() {
			this.skip();
			var directive = this.get('body.0');
			if (!directive.isExpressionStatement()) return;
			directive = directive.get('expression');
			if (!directive.isLiteral({ value: 'use asm' })) return;
			var state = new _program.ProgramState();
			_program2['default'].call(this, state);
			var tmpl = tmplAsm({
				outside: state.outside,
				stdlibImports: t.variableDeclaration('var', _Array$from(state.stdlibImports.values(), function (_ref2) {
					var uid = _ref2.uid;
					var expr = _ref2.expr;
					return t.variableDeclarator(uid, reattach(expr, t.identifier('stdlib')));
				})),
				foreignImports: t.variableDeclaration('var', _Array$from(state.foreignImports.values(), function (_ref3) {
					var uid = _ref3.uid;
					return t.variableDeclarator(uid, t.memberExpression(t.identifier('foreign'), uid));
				})),
				varDecls: state.varDecls,
				funcs: state.funcs,
				funcTables: state.funcTables,
				exports: t.objectExpression(_Array$from(state.exports.values(), function (_ref4) {
					var exported = _ref4.exported;
					var local = _ref4.local;
					return t.property('init', exported, local);
				})),
				foreign: t.objectExpression(_Array$from(state.foreignImports.values(), function (_ref5) {
					var uid = _ref5.uid;
					var expr = _ref5.expr;
					return t.property('init', uid, expr);
				})),
				exportOutside: [t.variableDeclaration('var', [t.variableDeclarator(t.objectPattern(_Array$from(state.exports.values(), function (_ref6) {
					var exported = _ref6.exported;
					var uid = _ref6.uid;
					return t.property('init', exported, uid);
				})), t.identifier('exports'))]), t.exportNamedDeclaration(null, _Array$from(state.exports.values(), function (_ref7) {
					var uid = _ref7.uid;
					var exported = _ref7.exported;
					return t.exportSpecifier(uid, exported);
				}))]
			});
			this.node.body = tmpl.body;
		}
	});
};