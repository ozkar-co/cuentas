import { api } from './api';

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: string;
  category_name?: string;
  description: string;
  raw_text?: string;
  date: Date;
}

export interface ParsedTransaction {
  amount: number;
  type: 'income' | 'expense';
  category_id?: string;
  category_name?: string;
  description: string;
}

interface ApiTransaction {
  _id: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: string;
  category_name?: string;
  description: string;
  raw_text?: string;
  date: string;
}

const mapTransaction = (t: ApiTransaction): Transaction => ({
  id: t._id,
  amount: t.amount,
  type: t.type,
  category_id: t.category_id,
  category_name: t.category_name,
  description: t.description,
  raw_text: t.raw_text,
  date: new Date(t.date),
});

export const parseTransaction = async (text: string): Promise<ParsedTransaction> => {
  return api.post<ParsedTransaction>('/cuentas/transactions/parse', { text });
};

export const addTransaction = async (
  transaction: Omit<Transaction, 'id' | 'date'> & { date?: Date; raw_text?: string }
): Promise<Transaction> => {
  const body = {
    amount: transaction.amount,
    type: transaction.type,
    description: transaction.description,
    category_id: transaction.category_id,
    category_name: transaction.category_name,
    raw_text: transaction.raw_text,
    date: transaction.date ? transaction.date.toISOString() : undefined,
  };
  const data = await api.post<ApiTransaction>('/cuentas/transactions', body);
  return mapTransaction(data);
};

export const deleteTransaction = async (transactionId: string): Promise<void> => {
  await api.delete(`/cuentas/transactions/${transactionId}`);
};

export const getTransactionsByMonth = async (year: number, month: number): Promise<Transaction[]> => {
  const data = await api.get<{ transactions: ApiTransaction[] }>(
    `/cuentas/transactions?year=${year}&month=${month}&page_size=100`
  );
  return data.transactions.map(mapTransaction);
};

export const getTransactionsByMonthRange = async (
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): Promise<Transaction[]> => {
  const results: Transaction[] = [];
  let year = startYear;
  let month = startMonth;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    const data = await api.get<{ transactions: ApiTransaction[] }>(
      `/cuentas/transactions?year=${year}&month=${month}&page_size=100`
    );
    results.push(...data.transactions.map(mapTransaction));
    month++;
    if (month > 12) { month = 1; year++; }
  }
  return results;
};
