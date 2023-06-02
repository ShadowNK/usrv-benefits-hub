import { Observable } from "rxjs";
import { GtwUserResponse } from "types/gtw_user_response";

/**
 * Methods to connect to the gateway
 */
export interface IHelloGateway {
  /**
   * Get a User from the server
   * @throws KushkiError
   * @param id - User id
   */
  getItem(id: string): Observable<GtwUserResponse>;
}
