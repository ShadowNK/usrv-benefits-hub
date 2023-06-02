import {IAPIGatewayEvent} from "@kushki/core";
import {LoginRequest} from "types/login_request";
import {Observable} from "rxjs";
import {LoginResponse} from "types/login_response";
import {TokenRequest} from "types/token_request";
import {BalanceResponse} from "types/balance_response";
import {Transaction} from "types/transaction_dynamo";
import {TransactionRequest} from "types/transaction_request";
import {RecognitionRequest} from "types/recognition_request";
import {Recognition} from "types/recognition_dynamo";


export interface ISessionService {
  loginHandler(
    event: IAPIGatewayEvent<null, LoginRequest>
  ): Observable<LoginResponse>;

  getBalance(
    event: IAPIGatewayEvent<null, TokenRequest>
  ): Observable<BalanceResponse>;

  getTransactions(
    event: IAPIGatewayEvent<null, TokenRequest>
  ): Observable<Transaction[]>;

  createTransaction(
    event: IAPIGatewayEvent<null, TransactionRequest>
  ): Observable<Transaction>;

  createRecognition(
    event: IAPIGatewayEvent<null, RecognitionRequest>
  ): Observable<Recognition>;


}
