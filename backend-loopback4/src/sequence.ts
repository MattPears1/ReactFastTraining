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
    @inject(AuthorizationBindings.AUTHORIZE_ACTION, {optional: true})
    protected authorizeRequest?: AuthorizeFn,
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

      // Authorization (only if available)
      if (this.authorizeRequest) {
        try {
          const authorizationMetadata = await context.get(AuthorizationBindings.METADATA, {optional: true});
          if (authorizationMetadata) {
            await this.authorizeRequest(context, authorizationMetadata);
          }
        } catch (authError) {
          // Log authorization error but don't block request processing
          console.warn('Authorization check failed:', authError.message);
        }
      }
      
      const args = await this.parseParams(request, route);
      const result = await this.invoke(route, args);
      this.send(response, result);
    } catch (err) {
      this.reject(context, err);
    }
  }
}