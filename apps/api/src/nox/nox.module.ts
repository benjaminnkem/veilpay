import { Global, Module } from '@nestjs/common';
import { NoxService } from './nox.service';
@Global()
@Module({ providers: [NoxService], exports: [NoxService] })
export class NoxModule {}
