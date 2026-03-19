import { Module } from '@nestjs/common';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';

@Module({
  imports: [PrescriptionsModule],
})
export class AppModule {}
