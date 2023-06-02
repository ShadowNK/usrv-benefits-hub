/**
 * Dynamo gateway interface file.
 */
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IndexEnum } from "infrastructure/IndexEnum";
import { Observable } from "rxjs";
import { UserDynamo } from "types/user_dynamo";
import {Wallet} from "types/wallet_dynamo";
import {Transaction} from "types/transaction_dynamo";
import {Reward} from "types/reward_dynamo";

/**
 * Gateway logic to connect to Dynamo.
 */
export interface IDynamoGateway {
  /**
   * Delete an item in dynamo table
   * @param table - name of the dynamo_put table
   * @param key - object with the key filter
   */
  remove(table: string, key: object): Observable<boolean>;
  /**
   * Put an item in dynamo table
   * @param data - to save in table
   * @param table - name of the dynamo_put table
   * @param condition - condition expression on the put
   */
  put(data: object, table: string, condition?: string): Observable<boolean>;

  /**
   * Query on table using an index
   * @param queryInput - object of query params
   */
  query<T = object>(queryInput: DocumentClient.QueryInput): Observable<T[]>;

  /**
   * Query on table using an index
   * @param table - name of the DynamoDB table
   * @param index - index of the DynamoDB table
   * @param value - name of the field and its value to search
   * @param limit - desired number of records to retrieve
   * @param lastEvKey - last evaluated key
   */
  queryByPage<T = object>(
    table: string,
    index: IndexEnum,
    limit: number,
    value: { [p: string]: string } | { [p: string]: number },
    lastEvKey?: DocumentClient.Key
  ): Observable<DynamoQueryResponse<T>>;

  /**
   * Query on table using an index
   * @param queryInput - object of query params
   */
  querySimple<T = object>(
    queryInput: DocumentClient.QueryInput
  ): Observable<DynamoQueryResponse<T>>;

  /**
   * Query on table using an index
   * @param scanInput - object of scan params
   */
  scan<T = object>(scanInput: DocumentClient.ScanInput): Observable<T[]>;

  /**
   * Get a table item from dynamo
   * @param table - table name
   * @param key - object with the key filter
   */
  getItem<T extends object>(
    table: string,
    key: object
  ): Observable<T | undefined>;

  /**
   * update a table item from dynamo with various values
   * @param tableName - name of Dynamo table
   * @param key - primary hash of table
   * @param values - object with values to update
   */
  updateValues(
    tableName: string,
    key: DocumentClient.Key,
    values: object
  ): Observable<boolean>;

  /**
   * get secuential id
   */
  getTransactionSequential(): Observable<number>;

  queryTrxsByStatusAndCreated<T>(
    transactionStatus: string,
    startDate: number,
    endDate: number
  ): Observable<T[]>;

  queryOnce<T>(queryInput: DocumentClient.QueryInput): Observable<T[]>;

  /**
   * Query on table using an index
   * @param table - name of the dynamo_put table
   * @param index - index's name on the table
   * @param field - index's field to filter the data
   * @param value - value to search on the index
   */
  simpleQuery<T = object>(
    table: string,
    index: IndexEnum,
    field: string,
    value: string
  ): Observable<T[]>;

  loginUser(
    email: string
  ): Observable<UserDynamo | undefined>;

  getWallet(walletId: string): Observable<Wallet>;

  getUserByToken(token: string): Observable<UserDynamo>;

  getUserByEmail(email: string): Observable<UserDynamo>;

  getTransactionsByWalletId(walletId: string): Observable<Transaction[]>;

  getFromTransactions(walletId: string): Observable<Transaction[]>;

  getToTransactions(walletId: string): Observable<Transaction[]>;

  getReward(rewardId: string): Observable<Reward>;
}

export type DynamoQueryResponse<T = object> = {
  items: T[];
  lastEvaluatedKey?: object;
};
