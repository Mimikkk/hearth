export class NodeFunctionInput {
  constructor(
    public type: string,
    public name: string,
    public count: number | null = null,
    public qualifier: string = '',
    public isConst: boolean = false,
  ) {}
}

export default NodeFunctionInput;
