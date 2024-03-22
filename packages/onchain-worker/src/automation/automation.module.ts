import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AutomationService } from './automation.service';
import { Web3Module } from '@app/web3/web3.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ChainSchema, Chains } from '@app/shared/models/schemas';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    Web3Module,
    MongooseModule.forFeature([{ name: Chains.name, schema: ChainSchema }]),
  ],
  providers: [AutomationService],
})
export class AutomationModule {}
