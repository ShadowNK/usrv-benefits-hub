/**
 *
 */
import { KushkiErrors, StatusCodeEnum } from "@kushki/core";

export enum ErrorCode {
  E001 = "E001",
  E002 = "E002",
  E003 = "E003",
  E006 = "E006",
}

export const ERRORS: KushkiErrors<ErrorCode> = {
  [ErrorCode.E001]: {
    code: ErrorCode.E001,
    message: "Cuerpo de la petición inválido.",
    statusCode: StatusCodeEnum.BadRequest,
  },
  [ErrorCode.E002]: {
    code: ErrorCode.E002,
    message: "Ha ocurrido un error inesperado.",
    statusCode: StatusCodeEnum.InternalServerError,
  },
  [ErrorCode.E003]: {
    code: ErrorCode.E003,
    message: "Error qwerty.",
    statusCode: StatusCodeEnum.BadRequest,
  },
  [ErrorCode.E006]: {
    code: ErrorCode.E006,
    message: "Error en integración.",
    statusCode: StatusCodeEnum.BadRequest,
  },
};
