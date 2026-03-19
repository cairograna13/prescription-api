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

const parseFrequency = (value: unknown): string => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (/^\d+$/.test(normalized)) {
      return `${normalized}/${normalized}h`;
    }

    return normalized;
  }

  if (typeof value === 'number' && !Number.isNaN(value)) {
    return `${value}/${value}h`;
  }

  return '';
};

const parseDate = (value: string): boolean => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime());
};

const isValidCpf = (cpf: string): boolean => {
  const cleanedCpf = cpf.replace(/\D/g, '');

  if (!/^\d{11}$/.test(cleanedCpf)) return false;
  if (/^(\d)\1{10}$/.test(cleanedCpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(cleanedCpf[i]) * (10 - i);
  }

  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;

  if (firstDigit !== Number(cleanedCpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(cleanedCpf[i]) * (11 - i);
  }

  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;

  return secondDigit === Number(cleanedCpf[10]);
};

export const prescriptionSchema = z
  .object({
    id: z.string().trim().min(1, 'id é obrigatório'),
    date: z
      .string()
      .trim()
      .min(1, 'date é obrigatório')
      .refine(parseDate, 'date inválida')
      .refine(
        (value) => new Date(`${value}T00:00:00.000Z`) <= new Date(),
        'date não pode ser futura',
      ),
    patient_cpf: z
      .string()
      .trim()
      .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos numéricos')
      .refine(isValidCpf, 'CPF inválido'),
    doctor_crm: z.string().trim().regex(/^\d+$/, 'CRM deve conter apenas números'),
    doctor_uf: z
      .string()
      .trim()
      .toUpperCase()
      .refine(
        (value) => BRAZILIAN_UFS.includes(value as (typeof BRAZILIAN_UFS)[number]),
        'UF inválida',
      ),
    medication: z.string().trim().min(1, 'medication é obrigatório'),
    controlled: z.preprocess(parseBoolean, z.boolean().default(false)),
    dosage: z.string().trim().min(1, 'dosage é obrigatório'),
    frequency: z.preprocess(
      parseFrequency,
      z
        .string({ required_error: 'frequency é obrigatório' })
        .min(1, 'frequency é obrigatório')
        .regex(
          /^(\d+|\d+\s*\/\s*\d+h)$/,
          'frequency deve ser um número positivo ou no formato 8/8h ou 12/12h',
        )
    ),
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

    const match = data.frequency.match(/^\d+\s*\/\s*(\d+)h$/);
    const frequencyHours = match ? Number(match[1]) : Number.NaN;

    if (data.controlled && frequencyHours > 60) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['frequency'],
        message: 'Medicamento controlado deve ter frequência máxima de 60 horas',
      });
    }
  });

export type ValidatedPrescription = z.infer<typeof prescriptionSchema>;