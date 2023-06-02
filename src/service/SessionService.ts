import {IAPIGatewayEvent} from "@kushki/core";
import {IDENTIFIERS} from "constant/Identifiers";
import {TABLES} from "constant/Resources";
import {TransactionStatusEnum} from "infrastructure/TransactionStatusEnum";
import {UserRolEnum} from "infrastructure/UserRolEnum";
import {inject, injectable} from "inversify";
import {defaultTo, get} from "lodash";
import "reflect-metadata";
import {IDynamoGateway} from "repository/IDynamoGateway";
import {ISessionService} from "repository/ISessionService";
import {forkJoin, iif, Observable, of} from "rxjs";
import {tag} from "rxjs-spy/operators";
import {catchError, map, mergeMap} from "rxjs/operators";
import {Utils} from "service/Utils";
import {BalanceResponse} from "types/balance_response";
import {LoginRequest} from "types/login_request";
import {LoginResponse} from "types/login_response";
import {Recognition} from "types/recognition_dynamo";
import {RecognitionRequest} from "types/recognition_request";
import {Reward} from "types/reward_dynamo";
import {TokenRequest} from "types/token_request";
import {Transaction} from "types/transaction_dynamo";
import {TransactionRequest} from "types/transaction_request";
import {UserDynamo} from "types/user_dynamo";
import {Wallet} from "types/wallet_dynamo";
import {v4} from "uuid";

/**
 * Implementation
 */
@injectable()
export class SessionService implements ISessionService {
  private readonly _dynamo: IDynamoGateway;

  constructor(
    @inject(IDENTIFIERS.DynamoGateway) dynamo: IDynamoGateway
  ) {
    this._dynamo = dynamo;
  }

  public loginHandler(
    event: IAPIGatewayEvent<null, LoginRequest>
  ): Observable<LoginResponse> {
    const email: string = get(event.body, "email", "");

    return of(1).pipe(
      mergeMap(()=> this._dynamo.loginUser(email)),
      mergeMap((user: UserDynamo | undefined) => {
        let current_user: UserDynamo =  {
          email: "",
          walletId: ""
        };
        const wallet: Wallet =  {
          balance: 0,
          walletId: ""
        };

        if (user !== undefined)
          current_user = {...user};
        else {
          wallet.walletId = v4().replace(/-/g, "");
          current_user.name = get(event.body, "name", "");
          current_user.email = get(event.body, "email", "");
          current_user.userType = UserRolEnum.empledo;
          current_user.walletId = wallet.walletId;
          this._dynamo.put(
            {
              balance: 0,
              walletId: wallet.walletId
            },
            TABLES.wallet
          )
        }
        current_user.token = v4().replace(/-/g, "");
        this._dynamo.put(current_user, TABLES.users);

        return forkJoin(
          of(current_user),
          of(wallet)
        );
      }),
      mergeMap(([user, wallet]: [UserDynamo, Wallet])=>
        forkJoin(
          of(user),
          iif(()=> wallet.walletId !== "",
            this._dynamo.getWallet(wallet.walletId),
            of(wallet))
        )
      ),
      mergeMap(([user, wallet]: [UserDynamo, Wallet])=>of({
          balance: wallet.balance,
          token: defaultTo(user.token,"")
      })),
      tag("HelloService | loginHandler")
    );
  }

  public getBalance(
    event: IAPIGatewayEvent<null, TokenRequest>
  ): Observable<BalanceResponse> {
    const token: string = get(event.body, "token", "");

    return of(1).pipe(
      mergeMap(()=>this._dynamo.getUserByToken(token)),
      mergeMap((user: UserDynamo)=>
        forkJoin(
          this._dynamo.getWallet(user.walletId),
          this._dynamo.getTransactionsByWalletId(user.walletId)
        )
      ),
      mergeMap(([wallet, transactions]: [Wallet, Transaction[]])=> of({
        balance: wallet.balance,
        transactions: Utils.getLastTransactions(transactions)
      })),
      tag("HelloService | getBalance")
    );
  }

  public getTransactions(
    event: IAPIGatewayEvent<null, TokenRequest>
  ): Observable<Transaction[]> {
    const token: string = get(event.body, "token", "");

    return of(1).pipe(
      mergeMap(()=>this._dynamo.getUserByToken(token)),
      mergeMap((user: UserDynamo)=>this._dynamo.getTransactionsByWalletId(user.walletId)),
      tag("HelloService | getTransactions")
    );
  }

  public createTransaction(
    event: IAPIGatewayEvent<null, TransactionRequest>
  ): Observable<Transaction> {
    const token: string = get(event.body, "token", "");
    const email: string = get(event.body, "email", "");
    const amount: string = get(event.body, "amount", "0");
    const reason: string = get(event.body, "email", "");

    return of(1).pipe(
      mergeMap(()=>forkJoin(
        this._dynamo.getUserByToken(token),
        this._dynamo.getUserByEmail(email),
      )),
      mergeMap(([from, to]: [UserDynamo, UserDynamo])=>{
        const current_date: Date = new Date();
        const date: number = Math.floor(current_date.getTime() / 1000);

        return of({
          date,
          reason,
          amount: Number(amount),
          fromWalletId: from.walletId,
          status: TransactionStatusEnum.pendiente,
          toWalletId: to.walletId,
          transactionId: v4(),
        })
      }),
      mergeMap((trx: Transaction)=>
        this._processTransaction(trx)
      ),
      tag("HelloService | createTransaction")
    );
  }

  public createRecognition(
    event: IAPIGatewayEvent<null, RecognitionRequest>
  ): Observable<Recognition> {
    const token: string = get(event.body, "token", "");
    const email: string = get(event.body, "email", "");
    const reward_id: string = get(event.body, "rewardId", "");
    let recognition: Recognition = {
      from: "",
      message: get(event.body, "message", ""),
      recognitionId: v4(),
      rewardId: reward_id,
      status: TransactionStatusEnum.pendiente,
      to: "",
      transactionId: v4(),
    };

    return of(1).pipe(
      mergeMap(()=>forkJoin(
        this._dynamo.getUserByToken(token),
        this._dynamo.getUserByEmail(email),
        this._dynamo.getReward(reward_id)
      )),
      mergeMap(([from, to, reward]: [UserDynamo, UserDynamo, Reward])=>{
        recognition = {
          ...recognition,
          from: defaultTo(from.foundingWalletId, ""),
          to: to.walletId
        };
        this._dynamo.put(recognition, TABLES.recognition);

        const current_date: Date = new Date();
        const date: number = Math.floor(current_date.getTime() / 1000);

        this._dynamo.put({

        }, TABLES.recognition)
        return of({
          date,
          amount: reward.value,
          fromWalletId: defaultTo(from.foundingWalletId, ""),
          reason: reward.name,
          status: TransactionStatusEnum.pendiente,
          toWalletId: to.walletId,
          transactionId: recognition.transactionId,
        });
      }),
      mergeMap((transaction: Transaction)=> this._processTransaction(transaction)),
      map((transaction: Transaction)=>{
        recognition.status = transaction.status;
        this._dynamo.put(recognition, TABLES.recognition);

        return recognition;
      }),
      map(()=>recognition),
      tag("HelloService | createRecognition")
    );
  }

  private _processTransaction(
    transaction: Transaction
  ): Observable<Transaction> {
    return of(1).pipe(
      mergeMap(()=>{
        this._dynamo.put(transaction, TABLES.transaction);

        return this._dynamo.getWallet(transaction.fromWalletId);
      }),
      mergeMap((fromWallet: Wallet)=>{
        if(fromWallet.balance<transaction.amount)
          throw Error("Fondos insuficientes")
        this._dynamo.put({...fromWallet, balance: fromWallet.balance-transaction.amount}, TABLES.wallet);

        return this._dynamo.getWallet(transaction.toWalletId);
      }),
      map((toWallet: Wallet)=>{
        this._dynamo.put({...toWallet, balance: toWallet.balance+transaction.amount}, TABLES.wallet);
      }),
      catchError(() =>
        of(this._updateStatus(transaction, TransactionStatusEnum.fallido))
      ),
      map(()=>
        this._updateStatus(transaction, TransactionStatusEnum.Aprobado)
      ),
    );
  }

  private _updateStatus(
    transaction: Transaction,
    trxStatus: TransactionStatusEnum
  ): Transaction {
    transaction = {
      ...transaction,
      status: trxStatus
    };
    this._dynamo.put(transaction, TABLES.transaction);

    return transaction;
  }

  /*
  public funcHandler(
    event: IAPIGatewayEvent<null, HelloRequest>
  ): Observable<boolean> {


    return of(1).pipe(
      map(()=>true),
      tag("HelloService | getHello")
    );
  }
   */
}
