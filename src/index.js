import 'better-log/install';
import { compile as compileTmpl } from 'estemplate';
import visitProgram, { ProgramState } from './program';

var tmplAsm = compileTmpl(`%= outside %;
var exports = (function asm(stdlib, foreign, heap) {
	"use asm";
	%= stdlibImports.declarations.length ? stdlibImports : { type: 'EmptyStatement' } %;
	%= foreignImports.declarations.length ? foreignImports : { type: 'EmptyStatement' } %;
	%= varDecls %;
	%= funcs %;
	%= funcTables %;
	return <%= exports %>;
})(typeof self !== "undefined" ? self : global, <%= foreign %>, new ArrayBuffer(0x10000));
%= exportOutside %;`);

module.exports = function ({ Transformer, types: t, parse }) {
	function reattach(member, newRoot) {
		if (t.isIdentifier(member)) {
			return t.memberExpression(newRoot, member);
		}
		return t.memberExpression(
			reattach(member.object, newRoot),
			member.property
		);
	}

	return new Transformer("asm-js", {
		Program() {
			this.skip();
			var directive = this.get('body.0');
			if (!directive.isExpressionStatement()) return;
			directive = directive.get('expression');
			if (!directive.isLiteral({ value: 'use asm' })) return;
			var state = new ProgramState();
			this::visitProgram(state);
			var tmpl = tmplAsm({
				outside: state.outside,
				stdlibImports: t.variableDeclaration('var', Array.from(
					state.stdlibImports.values(),
					({ uid, expr }) => t.variableDeclarator(uid, reattach(expr, t.identifier('stdlib')))
				)),
				foreignImports: t.variableDeclaration('var', Array.from(
					state.foreignImports.values(),
					({ uid }) => t.variableDeclarator(uid, t.memberExpression(
						t.identifier('foreign'),
						uid
					))
				)),
				varDecls: state.varDecls,
				funcs: state.funcs,
				funcTables: state.funcTables,
				exports: t.objectExpression(Array.from(
					state.exports.values(),
					({ exported, local }) => t.property('init', exported, local)
				)),
				foreign: t.objectExpression(Array.from(
					state.foreignImports.values(),
					({ uid, expr }) => t.property('init', uid, expr)
				)),
				exportOutside: [
					t.variableDeclaration('var', [t.variableDeclarator(
						t.objectPattern(Array.from(
							state.exports.values(),
							({ exported, uid }) => t.property('init', exported, uid)
						)),
						t.identifier('exports')
					)]),
					t.exportNamedDeclaration(null, Array.from(
						state.exports.values(),
						({ uid, exported }) => t.exportSpecifier(uid, exported)
					))
				]
			});
			this.node.body = tmpl.body;
		}
	});
};
