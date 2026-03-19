import { z } from 'zod';
import { BRAZILIAN_UFS } from '../../common/brazil';

const parseBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '') return false;
    if (['true', '1', 'yes', 'sim'].includes(normalized)) return true;
    if (['false', '0', 'no', 'nao', 'não'].includes(normalized)) return false;
  }
  return Boolean(value);
};

const parseDate = (value: string): boolean => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime());
};

export const prescriptionSchema = z
  .object({
    id: z.string().trim().min(1, 'id é obrigatório'),
    date: z
      .string()
      .trim()
      .min(1, 'date é obrigatório')
      .refine(parseDate, 'date inválida')
      .refine((value) => new Date(`${value}T00:00:00.000Z`) <= new Date(), 'date não pode ser futura'),
    patient_cpf: z.string().trim().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos numéricos'),
    doctor_crm: z.string().trim().regex(/^\d+$/, 'CRM deve conter apenas números'),
    doctor_uf: z
      .string()
      .trim()
      .toUpperCase()
      .refine((value) => BRAZILIAN_UFS.includes(value as (typeof BRAZILIAN_UFS)[number]), 'UF inválida'),
    medication: z.string().trim().min(1, 'medication é obrigatório'),
    controlled: z.preprocess(parseBoolean, z.boolean().default(false)),
    dosage: z.string().trim().min(1, 'dosage é obrigatório'),
    frequency: z.coerce.number()
    .int('frequency deve ser um número inteiro')
    .positive('frequency deve ser positivo'),
    duration: z.coerce
      .number({ invalid_type_error: 'duration deve ser numérico' })
      .positive('duration deve ser positivo')
      .max(90, 'duration deve ser no máximo 90 dias'),
    notes: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.controlled && (!data.notes || data.notes.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['notes'],
        message: 'Medicamento controlado requer observações',
      });
    }

    if (data.controlled && data.frequency > 60) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['frequency'],
        message: 'Medicamento controlado deve ter frequency máxima de 60 dias',
      });
    }
  });

export type ValidatedPrescription = z.infer<typeof prescriptionSchema>;
