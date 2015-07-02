import { STDLIB_TYPES, HEAP_VIEW_TYPES } from './tables';
import { Int, Double, Float, Extern } from './types';

export const GLOBALS = new Map([...STDLIB_TYPES.entries(), ...HEAP_VIEW_TYPES.entries()]);

export function typeError(msg) {
	throw this.errorWithNode(msg, TypeError);
}

export function assert(cond, msg) {
	if (!cond) {
		this::typeError(`Assertion failed: ${msg}`);
	}
}

const flowToAsmMappings = {
	int: Int,
	double: Double,
	float: Float
};

export function flowToAsm() {
	var annotation = this.get('typeAnnotation');
	this::assert(annotation.type === 'GenericTypeAnnotation', 'only generic type annotations are accepted');
	var type = annotation.node.id.name;
	this::assert(type in flowToAsmMappings, `unknown type ${type}`);
	return flowToAsmMappings[type];
}

export function wrap(type, force) {
	var {node} = this;
	if (!force) {
		let asmType = this.getData('asmType');
		if (asmType.subtype(type)) {
			return node;
		}
	}
	if (type.subtype(Int)) {
		return {
			type: 'BinaryExpression',
			left: node,
			operator: '|',
			right: { type: 'Literal', value: 0 }
		};
	}
	if (type.subtype(Double)) {
		return {
			type: 'UnaryExpression',
			operator: '+',
			argument: node
		};
	}
	if (type.subtype(Float)) {
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
	if (type.subtype(Extern)) {
		return node;
	}
	this::typeError(`can\'t wrap into type ${type}`);
}

export function validateType(path, expectedType) {
	var type = path.getData('asmType');
	if (expectedType !== undefined) {
		path::assert(type.subtype(expectedType), `expected ${expectedType} but got ${type}`);
	}
	return type;
}
