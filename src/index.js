import 'better-log/install';
import visitProgram, { ProgramState } from './program';

module.exports = function ({ Plugin, types: t }) {
	function reattach(member, newRoot) {
		if (t.isIdentifier(member)) {
			return t.memberExpression(newRoot, member);
		}
		return t.memberExpression(
			reattach(member.object, newRoot),
			member.property
		);
	}

	return new Plugin("asm-js", {
		visitor: {
			Program(node, parent, scope, file) {
				this.skip();
				var directive = this.get('body.0');
				if (!directive.isExpressionStatement()) return;
				directive = directive.get('expression');
				if (!directive.isLiteral({ value: 'use asm' })) return;
				var state = new ProgramState(t);
				this::visitProgram(state);
				var funcBody = [t.expressionStatement(t.literal('use asm'))];
				if (state.stdlibImports.size) {
					funcBody.push(t.variableDeclaration('var', Array.from(
						state.stdlibImports.values(),
						({ uid, expr }) => t.variableDeclarator(uid, reattach(expr, t.identifier('stdlib')))
					)));
				}
				if (state.foreignImports.size) {
					funcBody.push(t.variableDeclaration('var', Array.from(
						state.foreignImports.values(),
						({ uid }) => t.variableDeclarator(uid, t.memberExpression(
							t.identifier('foreign'),
							uid
						))
					)));
				}
				funcBody = funcBody.concat(state.varDecls, state.funcs, state.funcTables);
				funcBody.push(t.returnStatement(t.objectExpression(Array.from(
					state.exports.values(),
					({ id }) => t.property('init', id, id)
				))));
				var func = t.functionDeclaration(
					t.identifier('asm'),
					[t.identifier('stdlib'), t.identifier('foreign'), t.identifier('heap')],
					t.blockStatement(funcBody)
				);
				this.replaceWith(t.program([
					...state.outside,
					t.variableDeclaration('var', [
						t.variableDeclarator(
							t.identifier('selfGlobal'),
							t.callExpression(file.addHelper('self-global'), [])
						),
						t.variableDeclarator(
							t.identifier('foreign'),
							t.objectExpression(Array.from(
								state.foreignImports.values(),
								({ uid, outExpr }) => t.property('init', uid, outExpr)
							))
						),
						t.variableDeclarator(
							t.identifier('strings'),
							t.arrayExpression(state.strings.map(t.literal))
						)
					]),
					t.exportNamedDeclaration(t.variableDeclaration('var', Array.from(
						state.exports.values(),
						({ uid }) => t.variableDeclarator(uid)
					))),
					func,
					t.exportDefaultDeclaration(t.functionDeclaration(
						t.identifier('setHeap'),
						[t.identifier('heap')],
						t.blockStatement([
							t.variableDeclaration('var', [t.variableDeclarator(
								t.identifier('exported'),
								t.callExpression(t.identifier('asm'), ['selfGlobal', 'foreign', 'heap'].map(t.identifier))
							)]),
							...Array.from(
								state.exports.values(),
								({ uid, id }) => t.expressionStatement(t.assignmentExpression(
									'=',
									uid,
									t.memberExpression(t.identifier('exported'), id)
								))
							),
							t.returnStatement(t.identifier('exported'))
						])
					))
				]));
				file.scope = this.scope;
		        file.moduleFormatter.constructor.call(file.moduleFormatter, file);
			}
		}
	});
};
