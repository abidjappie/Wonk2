type Tail<T> = T extends [any, ...infer Tail] ? Tail : any[];

export class ControllerState<
  T extends Record<string, any>,
  U extends Record<
    string,
    (controllerState: ControllerState<T, U, V, X>, ...args: any) => any
  >,
  V extends Record<
    string,
    (controllerState: ControllerState<T, U, V, X>, ...args: any) => any
  >,
  X extends Record<
    string,
    (controllerState: ControllerState<T, U, V, X>) => any
  >
> {
  state: T;
  actions: U;
  setters: V;
  getters: X;
  history: [string, string, string][];

  constructor(initialState: { state: T; actions: U; setters: V; getters: X }) {
    this.state = initialState.state;
    this.actions = initialState.actions;
    this.setters = initialState.setters;
    this.getters = initialState.getters;
    this.commit = this.commit.bind(this);
    this.dispatch = this.dispatch.bind(this);
    // TODO: We need a better model for history
    this.history = [];
  }

  commit<S extends keyof V>(setter: S, ...args: Tail<Parameters<V[S]>>) {
    this.history.push(["Commit", String(setter), JSON.stringify(args)]);
    this.setters[setter](this, ...args);
  }

  async dispatch<S extends keyof U>(
    action: S,
    ...args: Tail<Parameters<U[S]>>
  ) {
    this.history.push(["Dispatch", String(action), JSON.stringify(args)]);
    const response = await this.actions[action](this, ...args).catch(
      (error: any) => {
        this.history.push(["Rejected", String(action), "Error"]);
        throw error;
      }
    );
    this.history.push([
      "Response",
      String(action),
      response ? JSON.stringify(response) : "Success",
    ]);
    return response;
  }

  useGetter<S extends keyof X>(getter: S) {
    return () => this.getters[getter](this);
  }
}

export default ControllerState;
