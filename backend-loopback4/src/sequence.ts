import {inject} from '@loopback/core';
import {
  FindRoute,
  InvokeMethod,
  InvokeMiddleware,
  ParseParams,
  Reject,
  RequestContext,
  RestBindings,
  Send,
  SequenceHandler,
} from '@loopback/rest';
import {
  AuthenticationBindings,
  AuthenticateFn,
} from '@loopback/authentication';
import {
  AuthorizationBindings,
  AuthorizeFn,
  AuthorizationDecision,
  AuthorizationMetadata,
} from '@loopback/authorization';

const SequenceActions = RestBindings.SequenceActions;

export class MySequence implements SequenceHandler {
  @inject(SequenceActions.INVOKE_MIDDLEWARE, {optional: true})
  protected invokeMiddleware: InvokeMiddleware = () => false;

  constructor(
    @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(SequenceActions.PARSE_PARAMS) protected parseParams: ParseParams,
    @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(SequenceActions.SEND) public send: Send,
    @inject(SequenceActions.REJECT) public reject: Reject,
    @inject(AuthenticationBindings.AUTH_ACTION)
    protected authenticateRequest: AuthenticateFn,
    @inject(AuthorizationBindings.AUTHORIZE_ACTION)
    protected authorizeRequest: AuthorizeFn,
  ) {}

  async handle(context: RequestContext) {
    try {
      const {request, response} = context;
      
      // Invoke middleware
      const finished = await this.invokeMiddleware(context);
      if (finished) return;
      
      const route = this.findRoute(request);

      // Authentication
      await this.authenticateRequest(request);

      // Authorization
      const authorizationMetadata = await this.authorizeRequest(
        context,
        await context.get(AuthorizationBindings.METADATA),
      );

      const args = await this.parseParams(request, route);
      const result = await this.invoke(route, args);
      this.send(response, result);
    } catch (err) {
      this.reject(context, err);
    }
  }
}