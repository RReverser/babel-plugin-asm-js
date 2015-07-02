import { assert, typeError, validateType, wrap, flowToAsm } from './util';
import { Fixnum, Unsigned, Double, Arrow, Overloaded, Int, Intish } from './types';
import { UNOPS, BINOPS } from './tables';

const LIMIT_FIXNUM = (1 << 31) >>> 0;
const LIMIT_UNSIGNED = Math.pow(2, 32);

var funcVisitor = {
	SequenceExpression: {
		exit: function SequenceExpression(node, parent, scope, state) {
			var expressions = this.get('expressions');
			this.setData('asmType', validateType(
				expressions[expressions.length - 1],
				state.type
			));
		}
	},

	UnaryExpression: {
		exit: function UnaryExpression(node, parent, scope, state) {
			var opTypes = UNOPS.get(node.operator).alts;
			var argType = this.get('argument').getData('asmType');
			for (let type of opTypes) {
				if (argType.subtype(type.params[0])) {
					this.setData('asmType', type.result);
					return;
				}
			}
			this::typeError(`Unsupported operation: ${node.operator} ${argType}`);
		}
	},

	BinaryExpression: {
		exit: function BinaryExpression(node, parent, scope, state) {
			var opTypes = BINOPS.get(node.operator).alts;
			var leftType = this.get('left').getData('asmType');
			var rightType = this.get('right').getData('asmType');
			for (let type of opTypes) {
				if (leftType.subtype(type.params[0]) && rightType.subtype(type.params[1])) {
					this.setData('asmType', type.result);
					return;
				}
			}
			this::typeError(`Unsupported operation: ${leftType} ${node.operator} ${rightType}`);
		}
	},

	Literal(node) {
		var { value } = node;
		this::assert(typeof value === 'number', 'only numeric literals are supported');
		if (node.raw.indexOf('.') < 0) {
			if (value < LIMIT_FIXNUM) {
				this.setData('asmType', Fixnum);
				return;
			}
			if (value < LIMIT_UNSIGNED) {
				this.setData('asmType', Unsigned);
				return;
			}
			node.raw += '.0';
		}
		this.setData('asmType', Double);
	},

	ReferencedIdentifier(node, parent, scope, state) {
		var binding = scope.getBinding(node.name);
		if (binding) {
			this.setData('asmType', binding.path.getData('asmType'));
		} else {
			state.program.import(this);
		}
	},

	MemberExpression(node, parent, scope, state) {
		if (state.program.import(this)) {
			this.skip();
		}
	},

	ReturnStatement: {
		exit: function ReturnStatement(node, parent, scope, state) {
			if (state.returnType === 'void') {
				let arg = node.argument;
				if (arg === null) {
					return;
				}
				return [
					{ type: 'ExpressionStatement', expression: arg },
					node
				];
			}
			node.argument = this.get('argument')::wrap(state.returnType, true);
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
			node.init = { type: 'Literal', value: 0, raw: asmType.subtype(Intish) ? '0' : '0.0' };
			return {
				type: 'AssignmentExpression',
				left: node.id,
				operator: '=',
				right: init.node
			};
		}
	},

	VariableDeclaration: {
		exit: function VariableDeclaration(node, parent, scope, state) {
			var expr = {
				type: 'SequenceExpression',
				expressions: node.declarations
			};
			if (parent.type === 'ForStatement') {
				return expr;
			}
			return {
				type: 'ExpressionStatement',
				expression: expr
			};
		}
	},

	AssignmentExpression: {
		exit: function AssignmentExpression(node, parent, scope, state) {
			var asmType = scope.getBinding(node.left.name).path.getData('asmType');
			var right = this.get('right');
			right.replaceWith(right::wrap(asmType));
		}
	},

	CallExpression: {
		exit: function CallExpression(node, parent, scope, state) {
			var callee = this.get('callee');
			callee::assert(callee.node.type === 'Identifier', 'only calls to direct identifiers are possible');
			var resultType = callee.getData('asmType').result;
			this.setData('asmType', resultType);
			this.replaceWith(this::wrap(resultType, true));
		}
	}
};

class FuncState {
	constructor(programState, returnType) {
		this.program = programState;
		this.returnType = returnType;
		this.vars = [];
	}
}

export default function visit(programState) {
	var paramTypes = [];
	var wrappedParams = this.get('params').map(param => {
		var asmType = param.get('typeAnnotation')::flowToAsm();
		param.setData('asmType', asmType);
		paramTypes.push(asmType);
		var { node } = param;
		return {
			type: 'ExpressionStatement',
			expression: {
				type: 'AssignmentExpression',
				left: node,
				operator: '=',
				right: param::wrap(asmType, true)
			}
		};
	});
	var returnType = this.get('returnType')::flowToAsm();
	this.setData('asmType', new Arrow(paramTypes, returnType));
	var funcState = new FuncState(programState, returnType);
	this.get('body').traverse(funcVisitor, funcState);
	this.get('body.body.0').insertBefore({
		type: 'VariableDeclaration',
		kind: 'var',
		declarations: funcState.vars
	});
	this.get('body.body.0').insertBefore(wrappedParams);
	programState.funcs.push(this.node);
}