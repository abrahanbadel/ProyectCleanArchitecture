import { z } from 'zod';

/**
 * Esquema de validación para la ejecución de una transferencia bancaria.
 */
export const TransferMoneySchema = z.object({
  sourceAccountId: z
    .uuid({ error: 'ID de cuenta de origen debe ser un UUID válido' }),
  destinationAccountId: z
    .uuid({ error: 'ID de cuenta de destino debe ser un UUID válido' }),
  amount: z
    .number({ error: 'El monto es requerido' })
    .positive('El monto a transferir debe ser un número estrictamente mayor a cero'),
  description: z
    .string()
    .max(100, 'La descripción no puede exceder los 100 caracteres')
    .optional(),
});

export const DepositMoneySchema = z.object({
  accountId: z
    .uuid({ error: 'ID de cuenta debe ser un UUID válido' }),
  amount: z
    .number({ error: 'El monto es requerido' })
    .positive('El monto a depositar debe ser un número estrictamente mayor a cero'),
});

export const WithdrawalMoneySchema = z.object({
  accountId: z
    .uuid({ error: 'ID de cuenta debe ser un UUID válido'}),
  amount: z
    .number({ error: 'El monto es requerido' })
    .positive('El monto a retirar debe ser un número estrictamente mayor a cero'),
});

export type TransferMoneyDTO = z.infer<typeof TransferMoneySchema>;
export type DepositMoneyDTO = z.infer<typeof DepositMoneySchema>;
export type WithdrawalMoneyDTO = z.infer<typeof WithdrawalMoneySchema>;
