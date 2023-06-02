import { IAPIGatewayEvent } from "@kushki/core";
import { Context } from "aws-lambda";
import { Observable } from "rxjs";
import { HelloRequest } from "types/hello_request";

/**
 * Connect gateway with data.
 */
export interface IHelloService {
  /**
   * Get a user instance by id
   * @param event - Lambda Event
   * @param context - Lambda Context
   */
  getHello(
    event: IAPIGatewayEvent<null, HelloRequest>,
    context?: Context
  ): Observable<object>;

  /**
   * Get a user instance by id
   * @param event - Lambda Event
   * @param context - Lambda Context
   */
  getBye(
    event: IAPIGatewayEvent<null, HelloRequest>,
    context?: Context
  ): Observable<object>;

  /**
   * Get a user instance by id
   * @param event - Lambda Event
   * @param context - Lambda Context
   */
  getGoodbye(event: HelloRequest, context?: Context): Observable<object>;
}
