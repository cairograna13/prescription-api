import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PrescriptionsService } from './prescriptions.service';
import { UploadStatus } from './interfaces/upload-status.interface';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadCsv(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UploadStatus> {
    return this.prescriptionsService.startUpload(file);
  }

  @Get('upload/:id')
  getUploadStatus(@Param('id') uploadId: string): UploadStatus {
    return this.prescriptionsService.getUploadStatus(uploadId);
  }
}
