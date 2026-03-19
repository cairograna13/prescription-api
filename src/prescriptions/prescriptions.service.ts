import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { PrescriptionsStore } from './prescriptions.store';
import {
  PrescriptionRecord,
  UploadError,
  UploadStatus,
} from './interfaces/upload-status.interface';
import {
  prescriptionSchema,
  ValidatedPrescription,
} from './schemas/prescription.schema';

@Injectable()
export class PrescriptionsService {
  private readonly logger = new Logger(PrescriptionsService.name);

  constructor(private readonly store: PrescriptionsStore) {}

  async startUpload(file?: Express.Multer.File): Promise<UploadStatus> {
    if (!file) {
      throw new BadRequestException('Arquivo CSV é obrigatório no campo "file"');
    }

    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('O arquivo enviado deve ser um CSV');
    }

    const totalRecords = this.countCsvRecords(file);
    const upload = this.store.createUpload(totalRecords);

    setImmediate(() => {
      this.processUpload(upload.upload_id, file).catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Erro interno ao processar CSV';

        this.logger.error(
          `Falha no processamento do upload ${upload.upload_id}: ${message}`,
        );

        this.store.fail(upload.upload_id, {
          line: 0,
          field: 'file',
          message,
          value: file.originalname,
        });
      });
    });

    return upload;
  }

  getUploadStatus(uploadId: string): UploadStatus {
    const upload = this.store.getUpload(uploadId);

    if (!upload) {
      throw new NotFoundException('Upload não encontrado');
    }

    return upload;
  }

  private countCsvRecords(file: Express.Multer.File): number {
    const rawCsv = file.buffer.toString('utf-8');

    const records = parse(rawCsv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, unknown>[];

    return records.length;
  }

  private async processUpload(
    uploadId: string,
    file: Express.Multer.File,
  ): Promise<void> {
    const rawCsv = file.buffer.toString('utf-8');

    const records = parse(rawCsv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, unknown>[];

    this.store.setTotalRecords(uploadId, records.length);

    this.logger.log(
      `Iniciando processamento do upload ${uploadId} com ${records.length} registros`,
    );

    for (const [index, row] of records.entries()) {
      const lineNumber = index + 2;
      this.processLine(uploadId, row, lineNumber);
      this.store.incrementProcessed(uploadId);
    }

    this.store.complete(uploadId);
    this.logger.log(`Upload ${uploadId} finalizado`);
  }

  private processLine(
    uploadId: string,
    row: Record<string, unknown>,
    lineNumber: number,
  ): void {
    if (typeof row.id === 'string' && this.store.hasPrescription(row.id.trim())) {
      this.store.addError(uploadId, {
        line: lineNumber,
        field: 'id',
        message: 'id já existe no sistema',
        value: row.id,
      });
      this.store.incrementInvalid(uploadId);
      return;
    }

    const parsed = prescriptionSchema.safeParse(row);

    if (!parsed.success) {
      const flattenedErrors: UploadError[] = parsed.error.issues.map((issue) => ({
        line: lineNumber,
        field: issue.path.join('.') || 'row',
        message: issue.message,
        value: this.resolveIssueValue(row, issue.path),
      }));

      flattenedErrors.forEach((error) => this.store.addError(uploadId, error));
      this.store.incrementInvalid(uploadId);
      return;
    }

    const prescription = this.toRecord(parsed.data);
    this.store.savePrescription(prescription);
    this.store.incrementValid(uploadId);
  }

  private toRecord(data: ValidatedPrescription): PrescriptionRecord {
    return {
      id: data.id,
      date: data.date,
      patient_cpf: data.patient_cpf,
      doctor_crm: data.doctor_crm,
      doctor_uf: data.doctor_uf,
      medication: data.medication,
      controlled: data.controlled,
      dosage: data.dosage,
      frequency: data.frequency,
      duration: data.duration,
      notes: data.notes,
    };
  }

  private resolveIssueValue(
    row: Record<string, unknown>,
    path: (string | number)[],
  ): unknown {
    if (!path.length) return row;

    const first = path[0];
    return typeof first === 'string' ? row[first] : undefined;
  }
}