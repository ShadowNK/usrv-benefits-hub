/**
 * Gateway Example
 */
import { IDENTIFIERS as CORE_ID, ILogger } from "@kushki/core";
import { inject, injectable } from "inversify";
import "reflect-metadata";
import { IHelloGateway } from "repository/IHelloGateway";
import * as rp from "request-promise";
import { Observable, of, throwError } from "rxjs";
import { tag } from "rxjs-spy/operators";
import { switchMap } from "rxjs/operators";
import { GtwUserResponse } from "types/gtw_user_response";

/**
 * Implementation
 */
@injectable()
export class HelloGateway implements IHelloGateway {
  private readonly _logger: ILogger;
  constructor(@inject(CORE_ID.Logger) logger: ILogger) {
    this._logger = logger;
  }
  public getItem(id: string): Observable<GtwUserResponse> {
    return of(1).pipe(
      switchMap(() => {
        if (id === "5") return throwError(new Error("error on switchMap"));
        this._logger.info("Test log.");

        return rp.get({
          json: true,
          uri: `https://jsonplaceholder.typicode.com/users/${id}`,
        });
      }),
      tag("HelloGateway | getItem")
    );
  }
}
