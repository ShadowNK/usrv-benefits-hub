/**
 * Injection identifiers
 */

export type containerSymbol = {
  AwsDocumentClient: symbol;
  DynamoGateway: symbol;
  HelloService: symbol;
  SessionService: symbol;
  HelloGateway: symbol;
};

const IDENTIFIERS: containerSymbol = {
  AwsDocumentClient: Symbol("AwsDocumentClient"),
  DynamoGateway: Symbol("DynamoGateway"),
  HelloGateway: Symbol.for("HelloGateway"),
  HelloService: Symbol.for("HelloService"),
  SessionService: Symbol.for("SessionService"),
};

export { IDENTIFIERS };
