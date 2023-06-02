/**
 * DynamoGateway Unit Tests
 */
import { ERRORS, KushkiError } from "@kushki/core";
import { AWSError } from "aws-sdk";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import { expect, use } from "chai";
import { IDENTIFIERS } from "constant/Identifiers";
import { TABLES } from "constant/Resources";
import { BrandEnum } from "infrastructure/BrandEnum";
import { CardTypeEnum } from "infrastructure/CardTypeEnum";
import { CONTAINER } from "infrastructure/Container";
import { DynamoUpdateActionsEnum } from "infrastructure/DynamoUpdateActionsEnum";
import { IndexEnum } from "infrastructure/IndexEnum";
import { ProcessorNamesEnum } from "infrastructure/ProcessorNamesEnum";
import { TokenStatusEnum } from "infrastructure/TokenStatusEnum";
import { TransactionStatusEnum } from "infrastructure/TransactionStatusEnum";
import { TransactionTypeEnum } from "infrastructure/TransactionTypeEnum";
import { DynamoQueryResponse, IDynamoGateway } from "repository/IDynamoGateway";
import { createSandbox, match, SinonSandbox, SinonStub } from "sinon";
import * as sinonChai from "sinon-chai";
import { Mock } from "ts-mockery";
import { SubscriptionTransactionDynamo } from "types/subscription_transaction_dynamo";

use(sinonChai);

describe("DynamoGateway - ", () => {
  let gateway: IDynamoGateway;
  let box: SinonSandbox;
  let put_data: object;
  let put_stub: SinonStub;
  let get_stub: SinonStub;
  let query_stub: SinonStub;
  let update_stub: SinonStub;
  let delete_stub: SinonStub;
  let g_transaction_fetch: SubscriptionTransactionDynamo;

  function getTransactionDynamo(): SubscriptionTransactionDynamo {
    return Mock.of<SubscriptionTransactionDynamo>({
      accountOwner: "dolor eiusmod in Lorem culpa",
      amount: {
        iva: 0,
        subtotalIva: 0,
        subtotalIva0: 0,
      },
      approvalCode: "ea quis",
      approvedTransactionAmount: 96655.74,
      bancoBogotaId: "ut Excepteur",
      bankName: "sit cupidatat in",
      contactDetails: {
        documentNumber: "ex culpa amet",
        documentType: "elit aute labore",
        dolore9ad: "Duis sit consectetur fugiat",
        email: "ipsum id ut Excepteur sed",
        firstName: "mollit Ut do irure sed",
        in_ef: 3967046,
        incididunt_9: "labore velit in",
        lastName: "sit eiusmod minim ullamco consequat",
        nisi_977: 603850.955,
        phoneNumber: "in sint",
        sit_40: -14745297.598808542,
      },
      country: "velit",
      created: 876497.46,
      currencyCode: "deserunt adipisicing",
      fileId: "sit id non",
      id: "Lorem eu",
      ivaValue: -145212.449,
      maskedAccountNumber: "sit in Lorem aliqua aute",
      merchantId: "nostrud dolore eu",
      merchantName: "veniam",
      metadata: {
        cillum_0: 82205755,
        est_f: 564275.72,
        labore32: "non nulla qui",
      },
      paymentBrand: "in aliqua",
      paymentMethod: "exercitation Excepteur eiusmod",
      privateProcessorId: "do",
      processorId: "do",
      processorName: "irure",
      requestAmount: 88131078.4,
      responseCode: "occaecat",
      responseText: "velit enim consectetur",
      sentToWebhook: true,
      subscriptionId: "Excepteur ipsum quis fugiat",
      subscriptionMetadata: {
        dolor57: 24976565,
        eaf1: 334967.99,
        occaecat_f4_: 43244660,
        sed_3bd: 514767.23,
      },
      subscriptionTrigger: "onDemand",
      subtotalIva: 10935111.38,
      subtotalIva0: 97818.96,
      ticketNumber: "non voluptate incididunt tempor",
      transactionStatus: "ipsum cupidatat officia incididunt ea",
      transactionType: "voluptate commodo sed cillum laboris",
    });
  }

  const mock_dynamo_gateway = () => {
    CONTAINER.rebind(IDENTIFIERS.AwsDocumentClient).toConstantValue(
      Mock.of<DocumentClient>({
        delete: delete_stub,
        get: get_stub,
        put: put_stub,
        query: query_stub,
        update: update_stub,
      })
    );
  };

  beforeEach(() => {
    box = createSandbox();
    CONTAINER.snapshot();
    g_transaction_fetch = getTransactionDynamo();
    put_data = { test: "hi!!", test2: "hello world" };
    put_stub = box.stub().returns({
      promise: box.stub().resolves(true),
    });
    update_stub = box.stub().returns({
      promise: box.stub().resolves(true),
    });
    get_stub = box.stub().returns({
      promise: box.stub().resolves({ Item: g_transaction_fetch }),
    });
    query_stub = box.stub().returns({
      promise: box.stub().resolves(g_transaction_fetch),
    });
    delete_stub = box.stub().returns({
      promise: box.stub().resolves(true),
    });
  });

  afterEach(() => {
    box.restore();
    CONTAINER.restore();
  });

  it("test put", (done: Mocha.Done) => {
    mock_dynamo_gateway();
    gateway = CONTAINER.get<IDynamoGateway>(IDENTIFIERS.DynamoGateway);
    gateway.put(put_data, "testStream").subscribe({
      complete: (): void => {
        expect(put_stub).to.be.calledOnce;
        expect(put_stub.getCall(0).args[0]).to.not.have.property(
          "ConditionExpression"
        );
        expect(put_stub.firstCall.args[0].Item.config.region).to.exist;
        done();
      },
    });
  });

  it("test put with condition", (done: Mocha.Done) => {
    mock_dynamo_gateway();
    gateway = CONTAINER.get<IDynamoGateway>(IDENTIFIERS.DynamoGateway);
    gateway.put(put_data, "testStream", "condition").subscribe({
      complete: (): void => {
        expect(put_stub).to.be.calledOnce;
        expect(put_stub.getCall(0).args[0]).to.have.property(
          "ConditionExpression",
          "condition"
        );
        done();
      },
    });
  });

  it("test querySimple", (done: Mocha.Done) => {
    mock_dynamo_gateway();

    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway.querySimple({ TableName: "asd" }).subscribe({
      next: (response: DynamoQueryResponse): void => {
        expect(query_stub).to.be.calledOnce;
        expect(response).to.haveOwnProperty("items");
        expect(response).to.haveOwnProperty("lastEvaluatedKey", undefined);
        done();
      },
    });
  });

  it("test put with condition and ConditionalCheckFailedException", (done: Mocha.Done) => {
    mock_dynamo_gateway();

    gateway = CONTAINER.get<IDynamoGateway>(IDENTIFIERS.DynamoGateway);
    gateway.put(put_data, "testStream", "condition").subscribe({
      complete: (): void => {
        expect(put_stub).to.be.calledOnce;
        done();
      },
    });
  });

  it("test put with error", (done: Mocha.Done) => {
    put_stub = box.stub().returns({
      promise: box.stub().rejects(new KushkiError(ERRORS.E322)),
    });
    mock_dynamo_gateway();

    gateway = CONTAINER.get<IDynamoGateway>(IDENTIFIERS.DynamoGateway);
    gateway.put(put_data, "testStream").subscribe({
      error: (err: Error): void => {
        expect(err).to.have.property("code", "K322");
        done();
      },
    });
  });

  it("test put with error with ConditionalCheckFailedException", (done: Mocha.Done) => {
    put_stub = box.stub().returns({
      promise: box.stub().rejects({ code: "ConditionalCheckFailedException" }),
    });
    mock_dynamo_gateway();

    gateway = CONTAINER.get<IDynamoGateway>(IDENTIFIERS.DynamoGateway);
    gateway.put(put_data, "testStream", "Condition").subscribe({
      next: (rs: boolean): void => {
        expect(rs).to.be.true;
        done();
      },
    });
  });

  it("test getItem", (done: Mocha.Done) => {
    mock_dynamo_gateway();
    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway
      .getItem("table", {
        key: "lorem",
      })
      .subscribe({
        next: (data: object | undefined): void => {
          expect(get_stub).to.be.calledOnce;
          expect(data).to.be.eqls(g_transaction_fetch);
          done();
        },
      });
  });

  it("test updateValues", (done: Mocha.Done) => {
    mock_dynamo_gateway();
    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway
      .updateValues("testTable", { id: "23" }, [["test", "value"]])
      .subscribe({
        next: (data: boolean): void => {
          expect(data).to.be.true;
          done();
        },
      });
  });

  it("test updateValues with Error", (done: Mocha.Done) => {
    const update_stub_error: SinonStub = box.stub().returns({
      promise: box.stub().rejects(new KushkiError(ERRORS.E322)),
    });

    CONTAINER.rebind(IDENTIFIERS.AwsDocumentClient).toConstantValue(
      Mock.of<DocumentClient>({
        query: update_stub_error,
      })
    );

    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway
      .updateValues("testTable", { id: "23" }, [["test", "value"]])
      .subscribe({
        error: (err: Error): void => {
          expect(err).not.to.be.undefined;
          done();
        },
      });
  });

  it("test removeValues", (done: Mocha.Done) => {
    mock_dynamo_gateway();
    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway.remove("testTable", { id: "24" }).subscribe({
      next: (data: boolean): void => {
        expect(data).to.be.true;
        done();
      },
    });
  });

  it("test updateItem - SET", (done: Mocha.Done) => {
    mock_dynamo_gateway();
    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway
      .updateItem<string>(
        "table_update",
        {
          key: "qwerty",
        },
        DynamoUpdateActionsEnum.SET,
        "field",
        "newString"
      )
      .subscribe({
        complete: (): void => {
          expect(update_stub).to.be.calledOnce;
          expect(update_stub).to.be.calledWithMatch({
            ExpressionAttributeValues: match.object,
            UpdateExpression: match(/^SET/),
          });
          done();
        },
      });
  });

  it("test getTransactionSequential - SET", (done: Mocha.Done) => {
    update_stub = box.stub().returns({
      promise: box.stub().resolves({ Attributes: { id: "1", quantity: 100 } }),
    });

    mock_dynamo_gateway();
    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway.getTransactionSequential().subscribe({
      next: (rs: number): void => {
        expect(update_stub).to.be.calledOnce;
        expect(rs).to.be.eqls(100);
        done();
      },
    });
  });

  it("test updateItem - REMOVE", (done: Mocha.Done) => {
    mock_dynamo_gateway();
    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway
      .updateItem(
        "table_update_remove",
        {
          key: "asdfg",
        },
        DynamoUpdateActionsEnum.REMOVE,
        "fieldToRemove"
      )
      .subscribe({
        complete: (): void => {
          expect(update_stub).to.be.calledOnce;
          expect(update_stub).to.be.calledWithMatch({
            UpdateExpression: match(/^REMOVE/),
          });
          done();
        },
      });
  });

  it("test query", (done: Mocha.Done) => {
    mock_dynamo_gateway();
    const output: SubscriptionTransactionDynamo[] = [
      Mock.of<SubscriptionTransactionDynamo>(),
    ];
    const query_stub_priv: SinonStub = box
      .stub()
      .returns({ promise: () => ({ Items: output }) });
    const params: DocumentClient.QueryInput = Mock.of<DocumentClient.QueryInput>(
      {}
    );

    CONTAINER.rebind(IDENTIFIERS.AwsDocumentClient).toConstantValue(
      Mock.of<DocumentClient>({
        query: query_stub_priv,
      })
    );

    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway.query(params).subscribe({
      complete: (): void => {
        expect(query_stub_priv).to.be.calledOnce;
        done();
      },
    });
  });

  it("test queryOnce", (done: Mocha.Done) => {
    mock_dynamo_gateway();
    const output: SubscriptionTransactionDynamo[] = [
      Mock.of<SubscriptionTransactionDynamo>(),
    ];
    const query_stub_priv: SinonStub = box
      .stub()
      .returns({ promise: () => ({ Items: output }) });
    const params: DocumentClient.QueryInput = Mock.of<DocumentClient.QueryInput>(
      {}
    );

    CONTAINER.rebind(IDENTIFIERS.AwsDocumentClient).toConstantValue(
      Mock.of<DocumentClient>({
        query: query_stub_priv,
      })
    );

    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway.queryOnce(params).subscribe({
      complete: (): void => {
        expect(query_stub_priv).to.be.callCount(1);
        done();
      },
    });
  });

  it("test queryByPage", (done: Mocha.Done) => {
    mock_dynamo_gateway();
    const output: SubscriptionTransactionDynamo[] = [
      Mock.of<SubscriptionTransactionDynamo>(),
    ];
    const query_stub_priv: SinonStub = box
      .stub()
      .returns({ promise: () => ({ Items: output }) });

    CONTAINER.rebind(IDENTIFIERS.AwsDocumentClient).toConstantValue(
      Mock.of<DocumentClient>({
        query: query_stub_priv,
      })
    );

    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway
      .queryByPage("table", IndexEnum.saleTicketNumber, 1, { ll: "" })
      .subscribe({
        complete: (): void => {
          expect(query_stub_priv).to.be.calledOnce;
          done();
        },
      });
  });

  it("test queryByTrxTypeAndCreated", (done: Mocha.Done) => {
    mock_dynamo_gateway();
    const output: SubscriptionTransactionDynamo[] = [
      Mock.of<SubscriptionTransactionDynamo>(),
    ];
    const query_stub_priv: SinonStub = box
      .stub()
      .returns({ promise: () => ({ Items: output }) });

    CONTAINER.rebind(IDENTIFIERS.AwsDocumentClient).toConstantValue(
      Mock.of<DocumentClient>({
        query: query_stub_priv,
      })
    );

    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway
      .queryByTrxTypeAndCreated(
        "893823",
        IndexEnum.saleTicketNumber,
        TransactionTypeEnum.ADJUSTMENT,
        2378823,
        2883278
      )
      .subscribe({
        complete: (): void => {
          expect(query_stub_priv).to.be.calledOnce;
          done();
        },
      });
  });

  it("test queryByTrxTypeAndCreatedAndProcessor", (done: Mocha.Done) => {
    mock_dynamo_gateway();
    const output: SubscriptionTransactionDynamo[] = [
      Mock.of<SubscriptionTransactionDynamo>(),
    ];
    const query_stub_priv: SinonStub = box
      .stub()
      .returns({ promise: () => ({ Items: output }) });

    CONTAINER.rebind(IDENTIFIERS.AwsDocumentClient).toConstantValue(
      Mock.of<DocumentClient>({
        query: query_stub_priv,
      })
    );

    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway
      .queryByTrxTypeAndCreatedAndProcessor(
        "893823",
        IndexEnum.saleTicketNumber,
        TransactionTypeEnum.ADJUSTMENT,
        2378823,
        2883278,
        ProcessorNamesEnum.MCPROCESSOR
      )
      .subscribe({
        complete: (): void => {
          expect(query_stub_priv).to.be.calledOnce;
          done();
        },
      });
  });

  it("test queryByPage with lastEvluated", (done: Mocha.Done) => {
    const query_stub_priv: SinonStub = box
      .stub()
      .onFirstCall()
      .returns({
        promise: () => ({
          Items: [Mock.of<SubscriptionTransactionDynamo>({ key: "213" })],
          LastEvaluatedKey: { "322332": "38493" },
        }),
      })
      .onSecondCall()
      .returns({
        promise: () => ({
          Items: [Mock.of<SubscriptionTransactionDynamo>({ key: "21" })],
        }),
      });

    CONTAINER.unbind(IDENTIFIERS.AwsDocumentClient);
    CONTAINER.bind(IDENTIFIERS.AwsDocumentClient).toConstantValue(
      Mock.of<DocumentClient>({
        query: query_stub_priv,
      })
    );

    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway
      .queryByPage(
        "table",
        IndexEnum.saleTicketNumber,
        1,
        { ll: "" },
        { key: "kjasjkakjsa" }
      )
      .subscribe({
        complete: (): void => {
          expect(query_stub_priv).to.be.calledOnce;
          done();
        },
      });
  });

  it("test scan", (done: Mocha.Done) => {
    const scan_stub: SinonStub = box.stub().returns({
      promise: () => ({
        Items: [Mock.of<SubscriptionTransactionDynamo>({ key: "21" })],
      }),
    });

    CONTAINER.rebind(IDENTIFIERS.AwsDocumentClient).toConstantValue(
      Mock.of<DocumentClient>({
        scan: scan_stub,
      })
    );

    const params: DocumentClient.QueryInput = Mock.of<DocumentClient.QueryInput>(
      {}
    );

    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway.scan(params).subscribe({
      complete: (): void => {
        expect(scan_stub).to.be.calledOnce;
        done();
      },
    });
  });

  it("test scan with evaluated key", (done: Mocha.Done) => {
    const scan_stub: SinonStub = box
      .stub()
      .onFirstCall()
      .returns({
        promise: () => ({
          Items: [Mock.of<SubscriptionTransactionDynamo>({ key: "213" })],
          LastEvaluatedKey: { "322332": "38493" },
        }),
      })
      .onSecondCall()
      .returns({
        promise: () => ({
          Items: [Mock.of<SubscriptionTransactionDynamo>({ key: "21" })],
        }),
      });

    CONTAINER.rebind(IDENTIFIERS.AwsDocumentClient).toConstantValue(
      Mock.of<DocumentClient>({
        scan: scan_stub,
      })
    );

    const params: DocumentClient.QueryInput = Mock.of<DocumentClient.ScanInput>(
      {}
    );

    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway.scan(params).subscribe({
      complete: (): void => {
        expect(scan_stub).to.be.calledTwice;
        done();
      },
    });
  });

  it("test scan 2", (done: Mocha.Done) => {
    const query_stub_priv: SinonStub = box
      .stub()
      .onFirstCall()
      .returns({
        promise: () => ({
          Items: [Mock.of<SubscriptionTransactionDynamo>({ key: "4334" })],
          LastEvaluatedKey: { "322332": "38493" },
        }),
      })
      .onSecondCall()
      .returns({
        promise: () => ({
          Items: [Mock.of<SubscriptionTransactionDynamo>({ key: "344343" })],
        }),
      });

    CONTAINER.rebind(IDENTIFIERS.AwsDocumentClient).toConstantValue(
      Mock.of<DocumentClient>({
        query: query_stub_priv,
      })
    );

    const params: DocumentClient.QueryInput = Mock.of<DocumentClient.ScanInput>(
      {}
    );

    gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
    gateway.query(params).subscribe({
      complete: (): void => {
        expect(query_stub_priv).to.be.calledTwice;
        done();
      },
    });
  });

  describe("updateTokenValue", () => {
    const expected_message_next: string = "next should not be called";

    it("when the token is used for the first time", (done: Mocha.Done) => {
      process.env.DYNAMO_TOKENS = "some-table";
      mock_dynamo_gateway();
      gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
      gateway.updateTokenValue("id", "123456789").subscribe({
        error: done,
        next: (resp) => {
          expect(resp).not.to.be.null;
          expect(update_stub).to.have.been.calledOnce.and.calledWith({
            ConditionExpression:
              "tokenStatus = :tokenStatusCreated AND attribute_not_exists(processingCode)",
            ExpressionAttributeNames: {
              "#processingCode": "processingCode",
              "#tokenStatus": "tokenStatus",
            },
            ExpressionAttributeValues: {
              ":processingCode": "123456789",
              ":tokenStatusCreated": TokenStatusEnum.CREATED,
              ":tokenStatusProcessed": TokenStatusEnum.PROCESSED,
            },
            Key: { token: "id" },
            ReturnValues: "ALL_NEW",
            TableName: "some-table",
            UpdateExpression:
              "SET #processingCode=:processingCode, #tokenStatus=:tokenStatusProcessed",
          });
          done();
        },
      });
    });

    it("when updating the token fails", (done: Mocha.Done) => {
      const error: AWSError = {
        code: "K002",
        message: "fail",
        name: "error",
        time: new Date(),
      };

      update_stub = box
        .stub()
        .returns({ promise: () => Promise.reject(error) });
      CONTAINER.unbind(IDENTIFIERS.AwsDocumentClient);
      CONTAINER.bind(IDENTIFIERS.AwsDocumentClient).toConstantValue(
        Mock.of<DocumentClient>({
          update: update_stub,
        })
      );

      gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
      gateway.updateTokenValue("id", "123456789").subscribe({
        error: (err: Error): void => {
          expect(err).to.have.property("code", "K002");
          done();
        },
        next: (): void => {
          done(expected_message_next);
        },
      });
    });

    it("when the token has been already used", (done: Mocha.Done) => {
      const error: AWSError = {
        code: "ConditionalCheckFailedException",
        message: "fail",
        name: "error",
        time: new Date(),
      };

      CONTAINER.unbind(IDENTIFIERS.AwsDocumentClient);
      CONTAINER.bind(IDENTIFIERS.AwsDocumentClient).toConstantValue(
        Mock.of<DocumentClient>({
          update: box.stub().returns({ promise: () => Promise.reject(error) }),
        })
      );

      gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
      gateway.updateTokenValue("id", "123456789").subscribe({
        error: (err: Error): void => {
          expect(err).to.have.property("code", "K022");
          done();
        },
        next: (): void => {
          done(expected_message_next);
        },
      });
    });

    it("Test simpleQuery", (done: Mocha.Done) => {
      mock_dynamo_gateway();
      gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
      gateway
        .simpleQuery(
          TABLES.transactionsTable,
          IndexEnum.transactionReferenceIndex,
          "transactionReference",
          "181063568268500321"
        )
        .subscribe({
          complete: (): void => {
            expect(query_stub).to.be.calledOnce;
            done();
          },
        });
    });

    it("Test queryByTrxTypeAndCreated with credit card", (done: Mocha.Done) => {
      mock_dynamo_gateway();
      gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
      gateway
        .queryByTrxAndCardType(
          TransactionTypeEnum.CHARGE,
          1679203545,
          CardTypeEnum.CREDIT,
          TransactionStatusEnum.APPROVAL,
          ProcessorNamesEnum.KUSHKI_ACQUIRER,
          BrandEnum.MASTERCARD
        )
        .subscribe({
          complete: (): void => {
            expect(query_stub).to.be.calledOnce;
            done();
          },
        });
    });

    it("Test queryByTrxTypeAndCreated with debit card", (done: Mocha.Done) => {
      mock_dynamo_gateway();
      gateway = CONTAINER.get(IDENTIFIERS.DynamoGateway);
      gateway
        .queryByTrxAndCardType(
          TransactionTypeEnum.CHARGE,
          1679203545,
          CardTypeEnum.DEBIT,
          TransactionStatusEnum.APPROVAL,
          ProcessorNamesEnum.KUSHKI_ACQUIRER,
          BrandEnum.MASTERCARD
        )
        .subscribe({
          complete: (): void => {
            expect(query_stub).to.be.calledOnce;
            done();
          },
        });
    });
  });
});
