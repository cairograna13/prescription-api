import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrescriptionRecord, UploadError, UploadStatus } from './interfaces/upload-status.interface';

@Injectable()
export class PrescriptionsStore {
  private readonly uploads = new Map<string, UploadStatus>();
  private readonly prescriptions = new Map<string, PrescriptionRecord>();

  createUpload(): UploadStatus {
    const upload: UploadStatus = {
      upload_id: randomUUID(),
      status: 'processing',
      total_records: 0,
      processed_records: 0,
      valid_records: 0,
      errors: [],
    };

    this.uploads.set(upload.upload_id, upload);
    return upload;
  }

  getUpload(uploadId: string): UploadStatus | undefined {
    return this.uploads.get(uploadId);
  }

  setTotalRecords(uploadId: string, total: number): void {
    const current = this.getUploadOrThrow(uploadId);
    current.total_records = total;
  }

  incrementProcessed(uploadId: string): void {
    const current = this.getUploadOrThrow(uploadId);
    current.processed_records += 1;
  }

  incrementValid(uploadId: string): void {
    const current = this.getUploadOrThrow(uploadId);
    current.valid_records += 1;
  }

  addError(uploadId: string, error: UploadError): void {
    const current = this.getUploadOrThrow(uploadId);
    current.errors.push(error);
  }

  complete(uploadId: string): void {
    const current = this.getUploadOrThrow(uploadId);
    current.status = current.errors.length > 0 ? 'completed' : 'completed';
  }

  fail(uploadId: string, error?: UploadError): void {
    const current = this.getUploadOrThrow(uploadId);
    current.status = 'failed';

    if (error) {
      current.errors.push(error);
    }
  }

  hasPrescription(id: string): boolean {
    return this.prescriptions.has(id);
  }

  savePrescription(prescription: PrescriptionRecord): void {
    this.prescriptions.set(prescription.id, prescription);
  }

  getAllPrescriptions(): PrescriptionRecord[] {
    return Array.from(this.prescriptions.values());
  }

  private getUploadOrThrow(uploadId: string): UploadStatus {
    const upload = this.uploads.get(uploadId);
    if (!upload) {
      throw new Error(`Upload ${uploadId} não encontrado no store.`);
    }
    return upload;
  }
}
