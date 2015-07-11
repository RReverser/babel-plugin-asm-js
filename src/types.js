class Type {
	equals(other) {
		return this === other;
	}

	subtype(other) {
		return this === other;
	}
}

// =============================================================================
// Value Types
// =============================================================================

export class ValueType extends Type {
	constructor(name, supertypes = []) {
		super();
		this.name = name;
		this.supertypes = new Set([this]);
		for (let directSuper of supertypes) {
			for (let type of directSuper.supertypes) {
				this.supertypes.add(type);
			}
		}
	}

	subtype(other) {
		return this.supertypes.has(other);
	}

	toString() {
		return this.name;
	}
}

export const Floatish = new ValueType('floatish');

export const MaybeFloat = new ValueType('float?', [Floatish]);

export const Float = new ValueType('float', [MaybeFloat]);

export const Intish = new ValueType('intish');

export const Int = new ValueType('int', [Intish]);

export const Extern = new ValueType('extern');

export const Signed = new ValueType('signed', [Extern, Int]);

export const Unsigned = new ValueType('unsigned', [Extern, Int]);

export const MaybeDouble = new ValueType('double?');

export const Double = new ValueType('double', [Extern, MaybeDouble]);

export const Fixnum = new ValueType('fixnum', [Signed, Unsigned]);

export const Void = new ValueType('void');

export const Str = new ValueType('string', [Extern]);

// =============================================================================
// Global Types
// =============================================================================

// ([ValueType], ValueType) -> Arrow
export class Arrow extends Type {
	constructor(params, result) {
		super();
		this.params = params;
		this.result = result;
	}

	equals(other) {
		return other instanceof Arrow &&
		       this.params.length === other.params.length &&
		       this.params.every((p, i) => p.equals(other.params[i])) &&
		       this.result.equals(other.result);
	}

	toString() {
		return `(${this.params.join(', ')}) => ${this.result}`;
	}
}

// ([Arrow]) -> Overloaded
export class Overloaded extends Type {
	constructor(alts) {
		super();
		this.alts = alts;
	}

	toString() {
		return this.alts.join(' | ');
	}
}

// (1|2|4|8, ValueType) -> View
export class View extends Type {
	constructor(bytes, loadType, storeType = loadType) {
		super();
		this.bytes = bytes;
		this.loadType = loadType;
		this.storeType = storeType;
	}

	toString() {
		var {loadType, storeType} = this;
		var ext = loadType === storeType ? loadType : `load: ${loadType}, store: ${storeType}`;
		return `View<${this.bytes}, ext)>`;
	}
}

// (Arrow, integer) -> Table
export class Table extends Type {
	constructor(type, length) {
		super();
		this.type = type;
		this.length = length;
	}

	toString() {
		return `(${this.type})[${this.length}]`;
	}
}

class ExternFunc extends Type {
	toString() {
		return 'Function';
	}
}

ExternFunc.prototype.result = Extern;

export const Func = new ExternFunc();

export class Module extends Type {}

export class ModuleParameter extends Type {}
