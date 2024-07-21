export class Program {
  body: any[] = [];

  constructor() {}
}

export class VariableDeclaration {
  declare isVariableDeclaration: true;

  constructor(
    public type: string,
    public name: string,
    public value: any = null,
    public next: any = null,
    public immutable: boolean = false,
  ) {}
}

VariableDeclaration.prototype.isVariableDeclaration = true;

export class Uniform {
  declare isUniform: true;

  constructor(
    public type: string,
    public name: string,
  ) {}
}

Uniform.prototype.isUniform = true;

export class Varying {
  constructor(
    public type: string,
    public name: string,
  ) {}
}

export class FunctionParameter {
  constructor(
    public type: string,
    public name: string,
    public qualifier: any = null,
    public immutable: boolean = true,
  ) {}
}

export class FunctionDeclaration {
  declare isFunctionDeclaration: true;
  body: any[] = [];

  constructor(
    public type: string,
    public name: string,
    public params: any[] = [],
  ) {
    this.body = [];
  }
}

FunctionDeclaration.prototype.isFunctionDeclaration = true;

export class Ternary {
  declare isTernary: true;

  constructor(
    public cond: any,
    public left: any,
    public right: any,
  ) {}
}

Ternary.prototype.isTernary = true;

export class Operator {
  declare isOperator: true;

  constructor(
    public type: string,
    public left: any,
    public right: any,
  ) {}
}

Operator.prototype.isOperator = true;

export class Unary {
  declare isUnary: true;

  constructor(
    public type: string,
    public expression: any,
    public after: boolean = false,
  ) {}
}

Unary.prototype.isUnary = true;

export class Number {
  declare isNumber: true;

  constructor(
    public value: string,
    public type: string = 'f32',
  ) {}
}

Number.prototype.isNumber = true;

export class String {
  declare isString: true;

  constructor(public value: any) {}
}

String.prototype.isString = true;

export class Conditional {
  declare isConditional: true;
  body: any[];
  elseConditional: any;

  constructor(public cond: any = null) {
    this.body = [];
    this.elseConditional = null;
  }
}

Conditional.prototype.isConditional = true;

export class FunctionCall {
  declare isFunctionCall: true;

  constructor(
    public name: string,
    public params: any[] = [],
  ) {}
}

FunctionCall.prototype.isFunctionCall = true;

export class Return {
  declare isReturn: true;

  constructor(public value: any) {}
}

Return.prototype.isReturn = true;

export class Accessor {
  declare isAccessor: true;

  constructor(public property: any) {}
}

Accessor.prototype.isAccessor = true;

export class StaticElement {
  declare isStaticElement: true;

  constructor(public value: any) {}
}

StaticElement.prototype.isStaticElement = true;

export class DynamicElement {
  declare isDynamicElement: true;

  constructor(public value: any) {}
}

DynamicElement.prototype.isDynamicElement = true;

export class AccessorElements {
  declare isAccessorElements: true;

  constructor(
    public property: any,
    public elements: any[] = [],
  ) {}
}

AccessorElements.prototype.isAccessorElements = true;

export class For {
  declare isFor: true;
  body: any[] = [];

  constructor(
    public initialization: any,
    public condition: any,
    public afterthought: any,
  ) {}
}

For.prototype.isFor = true;
