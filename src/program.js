import { assert, wrap, GLOBALS } from './util';
import visitFunc from './func';
import { STDLIB_MATH_TYPES } from './tables';
import { Func } from './types';

var programVisitor = {
	FunctionDeclaration(node, parent, scope, state) {
		this.skip();
		this::visitFunc(state);
	},

	ExportNamedDeclaration(node, parent, scope, state) {
		state.export(this);
	},

	ExportDefaultDeclaration(node, parent, scope, state) {
		state.export(this, 'default');
	},

	ImportDeclaration(node, parent, scope, state) {
		this.skip();
		state.outside.push(node);
	},

	VariableDeclaration(node, parent, scope, state) {
		state.varDecls.push(node);
	}
};

export class ProgramState {
	constructor(types) {
		this.t = types;
		this.outside = [];
		this.stdlibImports = new Map();
		this.foreignImports = new Map();
		this.varDecls = [];
		this.funcs = [];
		this.funcTables = [];
		this.exports = new Map();
	}

	import(ref) {
		var path = [], onlyIds = true;
		var fullRef = ref;
		for (; ref.isMemberExpression(); ref = ref.get('object')) {
			let property = ref.get('property');
			let propName;
			if (ref.is('computed')) {
				onlyIds = false;
				propName = property.node.value;
			} else {
				propName = property.node.name;
			}
			path.unshift(propName);
		}
		ref::assert(ref.isIdentifier(), 'root object should be an identifier');
		if (ref.scope.hasBinding(ref.node.name, true)) {
			return;
		}
		fullRef::assert(onlyIds, 'computed properties are not allowed');
		path.unshift(ref.node.name);
		var topPath = path[0];
		if (topPath === 'global') {
			path.shift();
			topPath = path[0];
		}
		var kind, map;
		if (topPath === 'Math' || GLOBALS.has(topPath)) {
			kind = 'stdlib';
			map = this.stdlibImports;
		} else {
			kind = 'foreign';
			map = this.foreignImports;
		}
		var importName = path.join('$');
		var importRec = map.get(importName);
		if (!importRec) {
			let asmType;
			if (kind === 'stdlib') {
				if (topPath === 'Math') {
					ref::assert(path.length === 2, 'too long path');
					asmType = STDLIB_MATH_TYPES.get(path[1]);
					ref::assert(asmType, 'unknown Math property');
				} else {
					asmType = GLOBALS.get(topPath);
				}
			} else {
				asmType = Func;
			}
			importRec = {
				kind,
				uid: ref.scope.generateUidIdentifier(importName),
				expr: fullRef.node,
				type: asmType
			};
			map.set(importName, importRec);
		}
		fullRef.replaceWith(importRec.uid);
		fullRef.setData('asmType', importRec.type);
	}

	export(ref, exportedName) {
		var func = ref.get('declaration');
		ref::assert(func.isFunctionDeclaration(), 'only immediate function declarations are supported');
		var id = func.get('id').node;
		if (exportedName === undefined) {
			exportedName = id.name;
		}
		this.exports.set(exportedName, {
			uid: ref.scope.generateUidIdentifier(exportedName),
			local: id,
			exported: { type: 'Identifier', name: exportedName }
		});
	}
}

export default function visit(state) {
	this.traverse(programVisitor, state);
}
