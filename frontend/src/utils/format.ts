import { UnitOfMeasure } from '../api/types';

export const money = (value = 0) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export const number = (value = 0) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(value);
export const dateTime = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
export const monthName = (month: number) => new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2026, month - 1, 1));
export const parseNumber = (value: string) => Number(value.replace(',', '.'));

export const unitLabels: Record<UnitOfMeasure, string> = {
  UNIT: 'un.', KG: 'kg', G: 'g', L: 'L', ML: 'ml', M: 'm', CM: 'cm', PACKAGE: 'pacote', BOX: 'caixa',
};

export const paymentLabels = {
  CASH: 'Dinheiro', PIX: 'Pix', CREDIT_CARD: 'Crédito', DEBIT_CARD: 'Débito', BANK_TRANSFER: 'Transferência', OTHER: 'Outro',
} as const;

export const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
