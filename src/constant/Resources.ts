export type TablesList = {
  orders: string;
  products: string;
  recognition: string;
  reward: string;
  shoppingCart: string;
  transaction: string;
  users: string;
  wallet: string;
};

const TABLES: TablesList = {
  orders: `${process.env.DYNAMO_ORDERS}`,
  products: `${process.env.DYNAMO_PRODUCTS}`,
  recognition: `${process.env.DYNAMO_RECOGNITIONS}`,
  reward: `${process.env.DYNAMO_REWARDS}`,
  shoppingCart: `${process.env.DYNAMO_SHOPPING_CART}`,
  transaction: `${process.env.DYNAMO_TRANSACTIONS}`,
  users: `${process.env.DYNAMO_USERS}`,
  wallet: `${process.env.DYNAMO_WALLET}`,
};

export {
  TABLES
};
