/* tslint:disable:no-redundant-parentheses */
/**
 * Hello Gateway Unit Test
 */
import { expect } from "chai";
import { IDENTIFIERS } from "constant/Identifiers";
import { CONTAINER } from "infrastructure/Container";
import { IHelloGateway } from "repository/IHelloGateway";
import * as rp from "request-promise";
import { createSandbox, SinonSandbox } from "sinon";

describe("HelloGateway - ", () => {
  let gateway: IHelloGateway;
  let box: SinonSandbox;

  beforeEach(() => {
    box = createSandbox();
    CONTAINER.snapshot();
  });
  afterEach(() => {
    box.restore();
    CONTAINER.restore();
  });
  it("getItem, success", (done: Mocha.Done) => {
    gateway = CONTAINER.get<IHelloGateway>(IDENTIFIERS.HelloGateway);
    box
      .stub(rp, "get")
      .returns(
        <rp.RequestPromise>(<unknown>Promise.resolve({ lorem: "ipsum" }))
      );
    gateway.getItem("1").subscribe({
      complete: done,
      error: done,
      next: (res: object): void => {
        expect(res).to.be.deep.eq({ lorem: "ipsum" });
      },
    });
  });
  it("getItem, error on switchMap", (done: Mocha.Done) => {
    gateway = CONTAINER.get<IHelloGateway>(IDENTIFIERS.HelloGateway);
    gateway.getItem("5").subscribe({
      error: (err: Error): void => {
        expect(err.message).to.be.eq("error on switchMap");
        done();
      },
      next: done,
    });
  });
});
