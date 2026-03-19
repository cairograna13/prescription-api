import { Module } from '@nestjs/common';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsStore } from './prescriptions.store';

@Module({
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService, PrescriptionsStore],
})
export class PrescriptionsModule {}
