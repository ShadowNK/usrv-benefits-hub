/**
 *    Dynamo Gateway
 */
import { KushkiError } from "@kushki/core";
import { AWSError } from "aws-sdk";
import {
  DocumentClient,
  PutItemInput,
  PutItemInputAttributeMap,
  UpdateItemOutput,
} from "aws-sdk/clients/dynamodb";
import { IDENTIFIERS } from "constant/Identifiers";
import { TABLES } from "constant/Resources";
import { ERRORS } from "infrastructure/ErrorEnum";
import { IndexEnum } from "infrastructure/IndexEnum";
import { inject, injectable } from "inversify";
import { defaultTo, get, isEmpty, set } from "lodash";
import "reflect-metadata";
import { DynamoQueryResponse, IDynamoGateway } from "repository/IDynamoGateway";
import {EMPTY, forkJoin, iif, Observable, of, throwError} from "rxjs";
import { tag } from "rxjs-spy/operators";
import {
  catchError,
  concatMap,
  expand,
  map,
  mapTo,
  mergeMap,
  reduce,
  switchMap,
} from "rxjs/operators";
import { UserDynamo } from "types/user_dynamo";
import {Wallet} from "types/wallet_dynamo";
import {Transaction} from "types/transaction_dynamo";
import {Reward} from "types/reward_dynamo";

/**
 * Dynamo Gateway to send data do DynamoDB
 */
@injectable()
export class DynamoGateway implements IDynamoGateway {
  private readonly _client: DocumentClient;
  private readonly _conditionalCheckFailedException: string =
    "ConditionalCheckFailedException";

  constructor(@inject(IDENTIFIERS.AwsDocumentClient) client: DocumentClient) {
    this._client = client;
  }

  public remove(table: string, key: object): Observable<boolean> {
    return of(1).pipe(
      switchMap(async () => {
        const params: DocumentClient.DeleteItemInput = {
          Key: key,
          TableName: table,
        };

        return this._client.delete(params).promise();
      }),
      tag("DynamoGateway | remove"),
      map(() => true)
    );
  }

  public put(
    data: object,
    table: string,
    condition?: string
  ): Observable<boolean> {
    set(
      data,
      "config.region",
      get(data, "config.region") || `${process.env.AWS_REGION}`
    );

    const params: PutItemInput = {
      Item: <PutItemInputAttributeMap>data,
      TableName: table,
    };

    if (condition !== undefined) params.ConditionExpression = condition;

    return of(1).pipe(
      switchMap(async () => this._client.put(params).promise()),
      catchError((err: AWSError) => {
        if (
          condition !== undefined &&
          err.code === this._conditionalCheckFailedException
        )
          return of(true);

        return throwError(err);
      }),
      tag("DynamoGateway | put"),
      map(() => true)
    );
  }
  // jscpd:ignore-start
  public query<T>(queryInput: DocumentClient.QueryInput): Observable<T[]> {
    return this._query(queryInput).pipe(
      expand((response: DocumentClient.QueryOutput) => {
        if (isEmpty(response.LastEvaluatedKey)) return EMPTY;

        return this._query({
          ...queryInput,
          ExclusiveStartKey: response.LastEvaluatedKey,
        });
      }),
      reduce(
        (accumulate: T[], current: DocumentClient.QueryOutput) => [
          ...accumulate,
          ...defaultTo(<T[]>current.Items, []),
        ],
        []
      ),
      tag("DynamoGateway | query")
    );
  }

  public queryOnce<T>(queryInput: DocumentClient.QueryInput): Observable<T[]> {
    return of(1).pipe(
      mergeMap(() =>
        this._query({
          ...queryInput,
        })
      ),
      map((output: DocumentClient.QueryOutput) =>
        defaultTo(<T[]>output.Items, [])
      ),
      tag("DynamoGateway | queryOnce")
    );
  }

  public scan<T>(scanInput: DocumentClient.ScanInput): Observable<T[]> {
    return this._scan(scanInput).pipe(
      expand((response: DocumentClient.ScanOutput) => {
        if (isEmpty(response.LastEvaluatedKey)) return EMPTY;

        return this._scan({
          ...scanInput,
          ExclusiveStartKey: response.LastEvaluatedKey,
        });
      }),
      reduce(
        (acc: T[], curr: DocumentClient.QueryOutput) => [
          ...acc,
          ...defaultTo(<T[]>curr.Items, []),
        ],
        []
      ),
      tag("DynamoGateway | scan")
    );
  }

  public getItem<T extends object>(
    table: string,
    key: object
  ): Observable<T | undefined> {
    return of(1).pipe(
      switchMap(async () => {
        const params: DocumentClient.GetItemInput = {
          ConsistentRead: true,
          Key: key,
          TableName: table,
        };

        return this._client.get(params).promise();
      }),
      map((output: DocumentClient.GetItemOutput) => <T>output.Item),
      tag("DynamoGateway | getItem")
    );
  }

  public queryByPage<T>(
    table: string,
    index: IndexEnum,
    limit: number,
    value: { [p: string]: string } | { [p: string]: number },
    lastEvKey?: DocumentClient.Key
  ): Observable<DynamoQueryResponse<T>> {
    return of(1).pipe(
      switchMap(async () => {
        const field_name: string = Object.keys(value)[0];

        const params: DocumentClient.QueryInput = {
          ExpressionAttributeValues: {
            ":d": value[field_name],
          },
          IndexName: index,
          KeyConditionExpression: `${field_name} = :d`,
          Limit: limit,
          TableName: table,
        };

        if (lastEvKey !== undefined) params.ExclusiveStartKey = lastEvKey;

        return this._client.query(params).promise();
      }),
      map((output: DocumentClient.QueryOutput) => {
        const response: DynamoQueryResponse<T> = {
          items: defaultTo(<T[]>output.Items, []),
        };

        if (output.LastEvaluatedKey !== undefined)
          response.lastEvaluatedKey = output.LastEvaluatedKey;

        return response;
      }),
      tag("DynamoGateway | queryByPage")
    );
  }

  public querySimple<T = object>(
    queryInput: DocumentClient.QueryInput
  ): Observable<DynamoQueryResponse<T>> {
    return of(queryInput).pipe(
      switchMap((params: DocumentClient.QueryInput) => this._query(params)),
      map((response: DocumentClient.QueryOutput) => ({
        items: defaultTo(<T[]>response.Items, []),
        lastEvaluatedKey: response.LastEvaluatedKey,
      }))
    );
  }

  public simpleQuery<T>(
    table: string,
    index: IndexEnum,
    field: string,
    value: string
  ): Observable<T[]> {
    return of(1).pipe(
      switchMap(async () => {
        const params: DocumentClient.QueryInput = {
          ExpressionAttributeValues: {
            ":d": value,
          },
          IndexName: index,
          KeyConditionExpression: `${field} = :d`,
          TableName: table,
        };

        return this._client.query(params).promise();
      }),
      map((output: DocumentClient.QueryOutput) =>
        defaultTo(<T[]>output.Items, [])
      ),
      tag("DynamoGateway | simpleQuery")
    );
  }

  public updateValues(
    tableName: string,
    key: DocumentClient.Key,
    values: object
  ): Observable<boolean> {
    return of(1).pipe(
      map(() => {
        const attribute_names: DocumentClient.ExpressionAttributeNameMap = {};
        const attribute_values: DocumentClient.ExpressionAttributeValueMap = {};
        let update_expression: string = "SET";

        Object.keys(values).forEach((valueKey: string) => {
          attribute_names[`#${valueKey}`] = valueKey;
          attribute_values[`:${valueKey}`] = values[`${valueKey}`];
          update_expression += ` #${valueKey}=:${valueKey},`;
        });

        update_expression = update_expression.substring(
          0,
          update_expression.length - 1
        );

        return {
          ExpressionAttributeNames: attribute_names,
          ExpressionAttributeValues: attribute_values,
          Key: key,
          TableName: tableName,
          UpdateExpression: update_expression,
        };
      }),
      mergeMap(async (params: DocumentClient.UpdateItemInput) =>
        this._client.update(params).promise()
      ),
      catchError((err: Error) => {
        throw new KushkiError(
          ERRORS.E003,
          "Error at updating with Dynamo",
          err
        );
      }),
      mapTo(true),
      tag("DynamoClient | updateValues")
    );
  }

  public getTransactionSequential(): Observable<number> {
    const sequential: string = `${process.env.USRV_STAGE}-${process.env.USRV_NAME}-transbank`;
    const params: {
      TableName: string;
      Key: object;
      UpdateExpression: string;
      ExpressionAttributeValues: object;
      ReturnValues: string;
    } = {
      ExpressionAttributeValues: { ":incr": 1 },
      Key: { id: sequential },
      ReturnValues: "UPDATED_NEW",
      TableName: "atomic_counter",
      UpdateExpression: "SET quantity = quantity + :incr",
    };

    return of(params).pipe(
      switchMap(async () => this._client.update(params).promise()),
      concatMap((x: UpdateItemOutput) => {
        const counter: { id: string; quantity: number } = <
          { id: string; quantity: number }
        >x.Attributes;

        return of(counter.quantity);
      }),
      tag("DynamoClient | getSequencial")
    );
  }

  // istanbul ignore next
  public queryTrxsByStatusAndCreated<T>(
    transactionStatus: string,
    startDate: number,
    endDate: number
  ): Observable<T[]> {
    return of(1).pipe(
      map(() => ({
        ExpressionAttributeNames: {
          "#created": "created",
          "#transactionStatus": "transactionStatus",
        },
        ExpressionAttributeValues: {
          ":enddate": endDate,
          ":startdate": startDate,
          ":transactionStatus": transactionStatus,
        },
        IndexName: "statusAndCreated",
        KeyConditionExpression:
          "#transactionStatus = :transactionStatus and #created between :startdate and :enddate",
        TableName: `${process.env.DYNAMO_TRANSACTIONS}`,
      })),
      switchMap(async (params: DocumentClient.QueryInput) =>
        this._client.query(params).promise()
      ),
      map((output: DocumentClient.QueryOutput) =>
        defaultTo(<T[]>output.Items, [])
      ),
      tag("DynamoGateway | queryByTrxTypeAndCreated")
    );
  }

  public loginUser(
    email: string
  ): Observable<UserDynamo | undefined> {
    return of(1).pipe(
      map(() => ({
        ExpressionAttributeNames: {
          "#email": "email",
        },
        ExpressionAttributeValues: {
          ":email": email,
        },
        IndexName: "existUserIndex",
        KeyConditionExpression:
          "#email = :email",
        TableName: TABLES.users,
      })),
      switchMap(async (params: DocumentClient.QueryInput) =>
        this._client.query(params).promise()
      ),
      map((output: DocumentClient.QueryOutput) =>
        defaultTo(<UserDynamo[]>output.Items, [])
      ),
      mergeMap((users: UserDynamo[])=>
        iif(
          () => users.length===0,
          undefined,
          of(users[0])
        )
      ),
      tag("DynamoGateway | loginUser")
    );
  }

  public getTransactionsByWalletId(walletId:string): Observable<Transaction[]> {
    return of(1).pipe(
      mergeMap(() => this.getFromTransactions(walletId)),
      mergeMap((fromTransactions: Transaction[]) => forkJoin(
        of(fromTransactions),
        this.getToTransactions(walletId)
      )),
      map(([from_transactions, to_transactions]: [Transaction[], Transaction[]]) =>
        [...from_transactions, ...to_transactions]
      ),
      tag("DynamoGateway | getTransactionsByWalletId")
    );
  }

  public getFromTransactions(walletId: string): Observable<Transaction[]> {
    return of(1).pipe(
      map(() => ({
        ExpressionAttributeNames: {
          "#fromWalletId": "fromWalletId",
        },
        ExpressionAttributeValues: {
          ":fromWalletId": walletId,
        },
        IndexName: "getFromWalletIndex",
        KeyConditionExpression:
          "#fromWalletId = :fromWalletId",
        TableName: TABLES.users,
      })),
      switchMap(async (params: DocumentClient.QueryInput) =>
        this._client.query(params).promise()
      ),
      map((output: DocumentClient.QueryOutput) =>
        defaultTo(<Transaction[]>output.Items, [])
      ),
      mergeMap((transactions: Transaction[])=>
        iif(
          () => transactions.length===0,
          of([]),
          of(transactions)
        )
      ),
      tag("DynamoGateway | getFromTransactions")
    );
  }

  // tslint:disable-next-line:no-identical-functions
  public getToTransactions(walletId: string): Observable<Transaction[]> {
    return of(1).pipe(
      map(() => ({
        ExpressionAttributeNames: {
          "#toWalletId": "toWalletId",
        },
        ExpressionAttributeValues: {
          ":toWalletId": walletId,
        },
        IndexName: "getToWalletIndex",
        KeyConditionExpression:
          "#toWalletId = :toWalletId",
        TableName: TABLES.users,
      })),
      switchMap(async (params: DocumentClient.QueryInput) =>
        this._client.query(params).promise()
      ),
      map((output: DocumentClient.QueryOutput) =>
        defaultTo(<Transaction[]>output.Items, [])
      ),
      mergeMap((transactions: Transaction[])=>
        iif(
          () => transactions.length===0,
          of([]),
          of(transactions)
        )
      ),
      tag("DynamoGateway | getToTransactions")
    );
  }


  public getWallet(walletId: string): Observable<Wallet> {
    return of(1).pipe(
      map(() => ({
        ExpressionAttributeNames: {
          "#walletId": "walletId",
        },
        ExpressionAttributeValues: {
          ":walletId": walletId,
        },
        IndexName: "getWalletIDIndex",
        KeyConditionExpression:
          "#walletId = :walletId",
        TableName: TABLES.users,
      })),
      switchMap(async (params: DocumentClient.QueryInput) =>
        this._client.query(params).promise()
      ),
      map((output: DocumentClient.QueryOutput) =>
        defaultTo(<Wallet[]>output.Items, [])
      ),
      mergeMap((wallets: Wallet[])=>
        iif(
          () => wallets.length===0,
          undefined,
          of(wallets[0])
        )
      ),
      tag("DynamoGateway | getWallet")
    );
  }

  public getReward(rewardId: string): Observable<Reward> {
    return of(1).pipe(
      map(() => ({
        ExpressionAttributeNames: {
          "#rewardId": "rewardId",
        },
        ExpressionAttributeValues: {
          ":rewardId": rewardId,
        },
        IndexName: "getRewardById",
        KeyConditionExpression:
          "#rewardId = :rewardId",
        TableName: TABLES.users,
      })),
      switchMap(async (params: DocumentClient.QueryInput) =>
        this._client.query(params).promise()
      ),
      map((output: DocumentClient.QueryOutput) =>
        defaultTo(<Reward[]>output.Items, [])
      ),
      mergeMap((rewards: Reward[])=>
        iif(
          () => rewards.length===0,
          undefined,
          of(rewards[0])
        )
      ),
      tag("DynamoGateway | getReward")
    );
  }

  public getUserByToken(token: string): Observable<UserDynamo> {
    return of(1).pipe(
      map(() => ({
        ExpressionAttributeNames: {
          "#token": "token",
        },
        ExpressionAttributeValues: {
          ":token": token,
        },
        IndexName: "getUserByTokenIndex",
        KeyConditionExpression:
          "#token = :token",
        TableName: TABLES.users,
      })),
      switchMap(async (params: DocumentClient.QueryInput) =>
        this._client.query(params).promise()
      ),
      map((output: DocumentClient.QueryOutput) =>
        defaultTo(<UserDynamo[]>output.Items, [])
      ),
      mergeMap((users: UserDynamo[])=>
        iif(
          () => users.length===0,
          undefined,
          of(users[0])
        )
      ),
      tag("DynamoGateway | getUserByToken")
    );
  }

  // tslint:disable-next-line:no-identical-functions
  public getUserByEmail(email: string): Observable<UserDynamo> {
    return of(1).pipe(
      map(() => ({
        ExpressionAttributeNames: {
          "#email": "email",
        },
        ExpressionAttributeValues: {
          ":email": email,
        },
        IndexName: "existUserIndex",
        KeyConditionExpression:
          "#email = :email",
        TableName: TABLES.users,
      })),
      switchMap(async (params: DocumentClient.QueryInput) =>
        this._client.query(params).promise()
      ),
      map((output: DocumentClient.QueryOutput) =>
        defaultTo(<UserDynamo[]>output.Items, [])
      ),
      mergeMap((users: UserDynamo[])=>
        iif(
          () => users.length===0,
          undefined,
          of(users[0])
        )
      ),
      tag("DynamoGateway | getUserByToken")
    );
  }

  private _query(
    queryInput: DocumentClient.QueryInput
  ): Observable<DocumentClient.QueryOutput> {
    return of(1).pipe(
      switchMap(async () => this._client.query(queryInput).promise()),
      tag("DynamoGateway | _query")
    );
  }

  private _scan(
    scanInput: DocumentClient.ScanInput
  ): Observable<DocumentClient.ScanOutput> {
    return of(1).pipe(
      switchMap(async () => this._client.scan(scanInput).promise()),
      tag("DynamoGateway | _scan")
    );
  }
}
