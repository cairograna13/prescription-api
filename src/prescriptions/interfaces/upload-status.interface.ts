export type UploadProcessingStatus = 'processing' | 'completed' | 'failed';

export interface UploadError {
  line: number;
  field: string;
  message: string;
  value: unknown;
}

export interface UploadStatus {
  upload_id: string;
  status: UploadProcessingStatus;
  total_records: number;
  processed_records: number;
  valid_records: number;
  errors: UploadError[];
}

export interface PrescriptionRecord {
  id: string;
  date: string;
  patient_cpf: string;
  doctor_crm: string;
  doctor_uf: string;
  medication: string;
  controlled: boolean;
  dosage: string;
  frequency: string;
  duration: number;
  notes?: string;
}