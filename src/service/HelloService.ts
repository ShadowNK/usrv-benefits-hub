import {
  ERRORS as CORE,
  IAPIGatewayEvent,
  IDENTIFIERS as ID,
  ILambdaGateway,
  KushkiError,
} from "@kushki/core";
import { Context } from "aws-lambda";
import { IDENTIFIERS } from "constant/Identifiers";
import { ERRORS } from "infrastructure/ErrorEnum";
import { inject, injectable } from "inversify";
import "reflect-metadata";
import { IHelloGateway } from "repository/IHelloGateway";
import { IHelloService } from "repository/IHelloService";
import * as Rollbar from "rollbar";
import { Observable, of } from "rxjs";
import { tag } from "rxjs-spy/operators";
import { map, mergeMap } from "rxjs/operators";
import { GtwUserResponse } from "types/gtw_user_response";
import { HelloRequest } from "types/hello_request";
import { UserResponse } from "types/user_response";
/**
 * Implementation
 */
@injectable()
export class HelloService implements IHelloService {
  private readonly _gateway: IHelloGateway;
  private readonly _context: Context;
  private readonly _rollbar: Rollbar;
  private readonly _lambda: ILambdaGateway;

  constructor(
    @inject(IDENTIFIERS.HelloGateway) gateway: IHelloGateway,
    @inject(ID.LambdaContext) context: Context,
    @inject(ID.RollbarInstance) rollbar: Rollbar,
    @inject(ID.LambdaGateway) lambda: ILambdaGateway
  ) {
    this._gateway = gateway;
    this._context = context;
    this._rollbar = rollbar;
    this._lambda = lambda;
  }

  public getHello(
    event: IAPIGatewayEvent<null, HelloRequest>
  ): Observable<object> {
    if (event.pathParameters.id === "1") throw new KushkiError(ERRORS.E003);
    if (event.pathParameters.id === "2") throw new KushkiError(CORE.E001);
    if (event.pathParameters.id === "3") throw new Error("error on service");

    return this._gateway.getItem(event.pathParameters.id).pipe(
      map((user: GtwUserResponse) => {
        if (event.pathParameters.id === "4") throw new Error("error on map");
        this._rollbar.warn("Test warn...");

        return {
          email: user.email,
          name: user.name,
          remainTime: this._context.getRemainingTimeInMillis(),
        };
      }),
      tag("HelloService | getHello")
    );
  }

  public getBye(
    event: IAPIGatewayEvent<null, HelloRequest>
  ): Observable<object> {
    return of(1).pipe(
      mergeMap(() =>
        this._lambda.invokeFunction<UserResponse>(
          `${process.env.GOODBYE_LAMBDA}`,
          event.pathParameters
        )
      ),
      tag("HelloService | getBye")
    );
  }

  public getGoodbye(event: HelloRequest): Observable<object> {
    if (event.id === "1") throw new KushkiError(ERRORS.E003);
    if (event.id === "2") throw new KushkiError(CORE.E001);
    if (event.id === "3") throw new Error("error on service");

    return this._gateway.getItem(event.id).pipe(
      map((user: GtwUserResponse) => {
        if (event.id === "4") throw new Error("error on map");
        this._rollbar.warn("Test warn...");

        return {
          email: user.email,
          name: user.name,
          remainTime: this._context.getRemainingTimeInMillis(),
        };
      }),
      tag("HelloService | getGoodbye")
    );
  }
}
