/**
 *
 */
import {
  CONTAINER as CONT_CORE,
  IDENTIFIERS as ID_CORE,
  KushkiErrors,
} from "@kushki/core";
import { IDENTIFIERS } from "constant/Identifiers";
import { HelloGateway } from "gateway/HelloGateway";
import { ErrorCode, ERRORS } from "infrastructure/ErrorEnum";
import { Container, interfaces } from "inversify";
import { IHelloGateway } from "repository/IHelloGateway";
import { IHelloService } from "repository/IHelloService";
import { HelloService } from "service/HelloService";

const CONT_APP: Container = new Container();

// Core
CONT_APP.bind<KushkiErrors<ErrorCode>>(ID_CORE.KushkiErrors).toConstantValue(
  ERRORS
);

// Service
CONT_APP.bind<IHelloService>(IDENTIFIERS.HelloService).to(HelloService);

// Gateway
CONT_APP.bind<IHelloGateway>(IDENTIFIERS.HelloGateway).to(HelloGateway);

const CONTAINER: interfaces.Container = Container.merge(CONT_CORE, CONT_APP);

export { CONTAINER };
