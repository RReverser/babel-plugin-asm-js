'use strict';

var _Array$from = require('babel-runtime/core-js/array/from')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

require('better-log/install');

var _program = require('./program');

var _program2 = _interopRequireDefault(_program);

var tmplAsm = compileTmpl('(function asm(stdlib, foreign, heap) {\n\t"use asm";\n\t%= stdlibImports.declarations.length ? stdlibImports : { type: \'EmptyStatement\' } %;\n\t%= foreignImports.declarations.length ? foreignImports : { type: \'EmptyStatement\' } %;\n\t%= varDecls %;\n\t%= funcs %;\n\t%= funcTables %;\n\treturn <%= exports %>;\n})(typeof self !== "undefined" ? self : global, <%= foreign %>, new ArrayBuffer(0x10000))');

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
		Program: function Program(node, parent, scope, file) {
			this.skip();
			var directive = this.get('body.0');
			if (!directive.isExpressionStatement()) return;
			directive = directive.get('expression');
			if (!directive.isLiteral({ value: 'use asm' })) return;
			var state = new _program.ProgramState(t);
			_program2['default'].call(this, state);
			var funcBody = [t.expressionStatement(t.literal('use asm'))];
			if (state.stdlibImports.size) {
				funcBody.push(t.variableDeclaration('var', _Array$from(state.stdlibImports.values(), function (_ref2) {
					var uid = _ref2.uid;
					var expr = _ref2.expr;
					return t.variableDeclarator(uid, reattach(expr, t.identifier('stdlib')));
				})));
			}
			if (state.foreignImports.size) {
				funcBody.push(t.variableDeclaration('var', _Array$from(state.foreignImports.values(), function (_ref3) {
					var uid = _ref3.uid;
					return t.variableDeclarator(uid, t.memberExpression(t.identifier('foreign'), uid));
				})));
			}
			funcBody = funcBody.concat(state.varDecls, state.funcs, state.funcTables);
			funcBody.push(t.returnStatement(t.objectExpression(_Array$from(state.exports.values(), function (_ref4) {
				var exported = _ref4.exported;
				var local = _ref4.local;
				return t.property('init', exported, local);
			}))));
			var func = t.functionExpression(t.identifier('asm'), [t.identifier('stdlib'), t.identifier('foreign'), t.identifier('heap')], t.blockStatement(funcBody));
			var exportOutside = t.callExpression(func, [t.callExpression(file.addHelper('self-global'), []), t.objectExpression(_Array$from(state.foreignImports.values(), function (_ref5) {
				var uid = _ref5.uid;
				var expr = _ref5.expr;
				return t.property('init', uid, expr);
			})), t.newExpression(t.identifier('ArrayBuffer'), [t.literal(0x10000)])]);
			switch (file.opts.modules) {
				case 'amd':
				case 'common':
				case 'commonStrict':
				case 'umd':
					exportOutside = [t.expressionStatement(t.callExpression(file.addHelper('defaults'), [t.identifier('exports'), exportOutside]))];
					break;

				default:
					exportOutside = [t.variableDeclaration('var', [t.variableDeclarator(t.objectPattern(_Array$from(state.exports.values(), function (_ref6) {
						var exported = _ref6.exported;
						var uid = _ref6.uid;
						return t.property('init', exported, uid);
					})), exportOutside)]), t.exportNamedDeclaration(null, _Array$from(state.exports.values(), function (_ref7) {
						var uid = _ref7.uid;
						var exported = _ref7.exported;
						return t.exportSpecifier(uid, exported);
					}))];
			}
			this.node.body = exportOutside;
		}
	});
};