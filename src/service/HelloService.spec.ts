/**
 * Hello Service Unit Tests
 */
import {
  IAPIGatewayEvent,
  IDENTIFIERS as ID,
  ILambdaGateway,
  KushkiError,
} from "@kushki/core";
import { Context } from "aws-lambda";
import { expect } from "chai";
import { IDENTIFIERS } from "constant/Identifiers";
import { HelloGateway } from "gateway/HelloGateway";
import { CONTAINER } from "infrastructure/Container";
import { IHelloGateway } from "repository/IHelloGateway";
import { IHelloService } from "repository/IHelloService";
import * as Rollbar from "rollbar";
import { of } from "rxjs";
import { createSandbox, SinonSandbox } from "sinon";
import { Mock } from "ts-mockery";
import { GtwUserResponse } from "types/gtw_user_response";
import { HelloRequest } from "types/hello_request";
import { UserResponse } from "types/user_response";

describe("HelloService - ", () => {
  let service: IHelloService;
  let box: SinonSandbox;

  function testHelloError(id: string, error: KushkiError | string): void {
    const mock_event: IAPIGatewayEvent<null, HelloRequest> = Mock.of<
      IAPIGatewayEvent<null, HelloRequest>
    >({
      pathParameters: {
        id,
      },
    });

    service = CONTAINER.get<IHelloService>(IDENTIFIERS.HelloService);
    expect(service.getHello.bind(service, mock_event)).to.throw(<Error>error);
  }

  function testGoodbyeError(id: string, error: KushkiError | string): void {
    const mock_event: HelloRequest = Mock.of<HelloRequest>({
      id,
    });

    service = CONTAINER.get<IHelloService>(IDENTIFIERS.HelloService);
    expect(service.getGoodbye.bind(service, mock_event)).to.throw(<Error>error);
  }

  beforeEach(() => {
    box = createSandbox();
    CONTAINER.snapshot();
    CONTAINER.bind(ID.RollbarInstance).toConstantValue(
      Mock.of<Rollbar>({
        warn: box.stub(),
      })
    );
    CONTAINER.bind(ID.LambdaContext).toConstantValue(
      Mock.of<Context>({
        getRemainingTimeInMillis: box.stub().returns(300),
      })
    );
  });
  afterEach(() => {
    box.restore();
    CONTAINER.restore();
  });
  it("test hello, success", (done: Mocha.Done) => {
    const expected: GtwUserResponse = Mock.of<GtwUserResponse>({
      email: "ipsum",
      name: "lorem",
    });
    const mock_event: IAPIGatewayEvent<null, HelloRequest> = Mock.of<
      IAPIGatewayEvent<null, HelloRequest>
    >({
      pathParameters: {
        id: "6",
      },
    });

    CONTAINER.unbind(IDENTIFIERS.HelloGateway);
    CONTAINER.bind(IDENTIFIERS.HelloGateway).toConstantValue(
      Mock.of<IHelloGateway>({
        getItem: box
          .stub()
          .withArgs(mock_event.pathParameters.id)
          .returns(of(expected)),
      })
    );
    service = CONTAINER.get<IHelloService>(IDENTIFIERS.HelloService);
    service.getHello(mock_event).subscribe({
      complete: done,
      error: done,
      next: (res: object): void => {
        expect(res).to.be.deep.eq({
          ...expected,
          remainTime: 300,
        });
      },
    });
  });
  it("test hello, error on service", () => {
    testHelloError("3", "error on service");
  });
  it("test hello, core kushkiError on service", () => {
    testHelloError("2", "STR001");
  });
  it("test hello, custom kushkiError on service", () => {
    testHelloError("1", "STR003");
  });
  it("test hello, error on observable", (done: Mocha.Done) => {
    const expected: GtwUserResponse = Mock.of<GtwUserResponse>({
      email: "ipsum",
      name: "lorem",
    });
    const mock_event: IAPIGatewayEvent<null, HelloRequest> = Mock.of<
      IAPIGatewayEvent<null, HelloRequest>
    >({
      pathParameters: {
        id: "4",
      },
    });

    service = CONTAINER.get<IHelloService>(IDENTIFIERS.HelloService);
    box
      .stub(HelloGateway.prototype, "getItem")
      .withArgs(mock_event.pathParameters.id)
      .returns(of(expected));
    service.getHello(mock_event).subscribe({
      error: (err: Error): void => {
        expect(err.message).to.be.eq("error on map");
        done();
      },
      next: done,
    });
  });
  it("test bye, success", (done: Mocha.Done) => {
    const expected: UserResponse = Mock.of<UserResponse>({
      email: "ipsum",
      name: "lorem",
      remainTime: 300,
    });
    const mock_event: IAPIGatewayEvent<null, HelloRequest> = Mock.of<
      IAPIGatewayEvent<null, HelloRequest>
    >({
      pathParameters: {
        id: "6",
      },
    });

    CONTAINER.unbind(ID.LambdaGateway);
    CONTAINER.bind(ID.LambdaGateway).toConstantValue(
      Mock.of<ILambdaGateway>({
        invokeFunction: box.stub().returns(of(expected)),
      })
    );
    service = CONTAINER.get<IHelloService>(IDENTIFIERS.HelloService);
    service.getBye(mock_event).subscribe({
      complete: done,
      error: done,
      next: (res: object): void => {
        expect(res).to.be.deep.eq({
          ...expected,
        });
      },
    });
  });
  it("test goodbye, success", (done: Mocha.Done) => {
    const expected: UserResponse = Mock.of<UserResponse>({
      email: "ipsum",
      name: "lorem",
      remainTime: 300,
    });
    const mock_event: HelloRequest = Mock.of<HelloRequest>({
      id: "6",
    });

    CONTAINER.unbind(IDENTIFIERS.HelloGateway);
    CONTAINER.bind(IDENTIFIERS.HelloGateway).toConstantValue(
      Mock.of<IHelloGateway>({
        getItem: box.stub().withArgs(mock_event.id).returns(of(expected)),
      })
    );
    service = CONTAINER.get<IHelloService>(IDENTIFIERS.HelloService);
    service.getGoodbye(mock_event).subscribe({
      complete: done,
      error: done,
      next: (res: object): void => {
        expect(res).to.be.deep.eq(expected);
      },
    });
  });
  it("test goodbye, error on service", () => {
    testGoodbyeError("3", "error on service");
  });
  it("test goodbye, core kushkiError on service", () => {
    testGoodbyeError("2", "STR001");
  });
  it("test goodbye, custom kushkiError on service", () => {
    testGoodbyeError("1", "STR003");
  });
  it("test goodbye, error on observable", (done: Mocha.Done) => {
    const expected: UserResponse = Mock.of<UserResponse>({
      email: "ipsum",
      name: "lorem",
      remainTime: 300,
    });
    const mock_event: HelloRequest = Mock.of<HelloRequest>({
      id: "4",
    });

    CONTAINER.unbind(IDENTIFIERS.HelloGateway);
    CONTAINER.bind(IDENTIFIERS.HelloGateway).toConstantValue(
      Mock.of<IHelloGateway>({
        getItem: box.stub().withArgs(mock_event.id).returns(of(expected)),
      })
    );
    service = CONTAINER.get<IHelloService>(IDENTIFIERS.HelloService);
    service.getGoodbye(mock_event).subscribe({
      error: (err: Error): void => {
        expect(err.message).to.be.eq("error on map");
        done();
      },
      next: done,
    });
  });
});
