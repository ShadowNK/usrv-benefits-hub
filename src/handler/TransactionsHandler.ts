/**
 *  Hello Handler
 */
import {
  BUILDER_API_GATEWAY_MIDDLEWARE,
  ERROR_MIDDLEWARE,
  IAPIGatewayEvent,
  IDENTIFIERS as ID,
  IHandler,
  INPUT_OUTPUT_LOGS,
  IRollbar,
  SETUP_MIDDLEWARE,
} from "@kushki/core";
import { Handler } from "aws-lambda";
import { IDENTIFIERS } from "constant/Identifiers";
import { CONTAINER } from "infrastructure/Container";
import * as middy from "middy";
import "reflect-metadata";
import {ISessionService} from "repository/ISessionService";
import * as Rollbar from "rollbar";
import "source-map-support/register";

const CORE: IHandler = CONTAINER.get<IHandler>(ID.Handler);
const ROLLBAR: Rollbar = CONTAINER.get<IRollbar>(ID.Rollbar).init();
const HANDLER: middy.Middy<IAPIGatewayEvent<string | object>, object> = middy<
  Handler<IAPIGatewayEvent<string | object>>
>(
  ROLLBAR.lambdaHandler(
    CORE.run<
      ISessionService, // Service Definition
      object // Service observable resolve type
    >(
      IDENTIFIERS.SessionService, // Service Symbol
      "getTransactions", // Service Method
      CONTAINER,
      ROLLBAR
    )
  )
)
  // Middlewares (https://middy.js.org/)
  .use(SETUP_MIDDLEWARE(ROLLBAR))
  .use(INPUT_OUTPUT_LOGS(ROLLBAR))
  .use(ERROR_MIDDLEWARE(ROLLBAR))
  .use(BUILDER_API_GATEWAY_MIDDLEWARE(ROLLBAR));

export { HANDLER };
