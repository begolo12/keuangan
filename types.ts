export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  category: string;
  amount: number;
}

export interface Debt {
  id: string;
  creditor: string;
  totalAmount: number;
  monthlyInstallment: number;
  totalInstallmentMonths: number;
  monthsPaid: number;
  startDate: string;
}
