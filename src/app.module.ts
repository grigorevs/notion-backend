import { Module } from '@nestjs/common';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [DocumentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
