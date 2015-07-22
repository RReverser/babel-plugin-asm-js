import { assert, typeError, validateType, getWrap, replaceWrap, flowToAsm, unish } from './util';
import { Fixnum, Unsigned, Double, Arrow, Overloaded, Int, Intish, Str } from './types';
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
					this::unish();
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
					this::unish();
					return;
				}
			}
			this::typeError(`Unsupported operation: ${leftType} ${node.operator} ${rightType}`);
		}
	},

	Literal(node, parent, scope, state) {
		var { value } = node;
		if (typeof value === 'string') {
			let id = state.program.strings.indexOf(value);
			if (id < 0) {
				id = state.program.strings.push(value) - 1;
			}
			this.setData('asmType', Str);
			node.value = id;
			return;
		}
		this::assert(typeof value === 'number', 'only numeric and string literals are supported');
		if (node.raw && node.raw.indexOf('.') < 0) {
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
		if (state.program.import(this, parent.type === 'CallExpression')) {
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
					state.t.expressionStatement(arg),
					node
				];
			}
			this.get('argument')::replaceWrap(state.returnType, true);
		}
	},

	VariableDeclarator: {
		enter: function VariableDeclarator(node, parent, scope) {
			// Babel plugins can't depend on other transformations (yet?)
			// so I have to loosely reimplement block scoping like this
			this::assert(node.init, 'variable should have an initializer');
			if (parent.kind !== 'var') {
				scope.rename(node.id.name);
			}
		},
		exit: function VariableDeclarator(node, parent, scope, state) {
			var init = this.get('init');
			var asmType = init.getData('asmType');
			this.setData('asmType', asmType);
			state.vars.push(node);
			if (node.init.type === 'Literal' && node.init.value === 0) {
				return this.dangerouslyRemove();
			}
			node.init = state.t.literal(0);
			if (!asmType.subtype(Intish)) {
				node.init.raw = '0.0';
			}
			return state.t.assignmentExpression('=', node.id, init.node);
		}
	},

	VariableDeclaration: {
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
			this.get('right')::replaceWrap(asmType);
		}
	},

	CallExpression: {
		exit: function CallExpression(node, parent, scope, state) {
			var callee = this.get('callee');
			callee::assert(callee.node.type === 'Identifier', 'only calls to direct identifiers are possible');
			var resultType = callee.getData('asmType').result;
			this::replaceWrap(resultType, true)::unish();
		}
	},

	TypeCastExpression: {
		exit: function TypeCastExpression(node) {
			var asmType = this.get('typeAnnotation')::flowToAsm();
			this.setData('asmType', asmType);
			return this.get('expression')::getWrap(asmType);
		}
	}
};

class FuncState {
	constructor(programState, returnType) {
		this.t = programState.t;
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
		return programState.t.expressionStatement(programState.t.assignmentExpression(
			'=',
			node,
			param::getWrap(asmType)
		));
	});
	var returnType = this.get('returnType')::flowToAsm();
	this.setData('asmType', new Arrow(paramTypes, returnType));
	var funcState = new FuncState(programState, returnType);
	this.get('body').traverse(funcVisitor, funcState);
	if (funcState.vars.length) {
		this.get('body.body.0').insertBefore(programState.t.variableDeclaration('var', funcState.vars));
	}
	this.get('body.body.0').insertBefore(wrappedParams);
	programState.funcs.push(this.node);
}
