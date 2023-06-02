import { defaultTo } from "lodash";
import { Transaction } from "types/transaction_dynamo";

export class Utils {
	public static getLastTransactions(traansactions: Transaction[], max: number = 5): Transaction[] {
		const sorted_elements = traansactions.sort(
			(a, b) =>
				defaultTo(b.date, 0) - defaultTo(a.date, 0)
		);

		return sorted_elements.slice(0, max);
	}
}