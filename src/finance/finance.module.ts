
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Wallet } from './entities/Wallet.entity';
import { ScoreValue } from './entities/ScoreValue.entity';
import { Transaction } from './entities/Transaction.entity';
import { ManualWithdrawalRequest } from './entities/manual-withdrawal-request.entity';
import { Project } from '../project/entities/Project.entity';

import { WalletService } from './service/Wallet.service';
import { ScoreValueService } from './service/ScoreValue.service';
import { SantimpaySdk } from './service/SantimPay.service';
import { TransactionService } from './service/Transaction.service';
import { PayoutReconciliationService } from './service/PayoutReconciliation.service';
import { ManualWithdrawalRequestService } from './service/manual-withdrawal-request.service';

import { WalletController } from './controller/Wallet.controller';
import { TransactionController } from './controller/Transaction.controller';
import { ScoreValueController } from './controller/ScoreValue.controller';
import { ManualWithdrawalRequestController } from './controller/manual-withdrawal-request.controller';
import { UserTask } from '../project/entities/UserTask.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      ScoreValue,
      Transaction,
      ManualWithdrawalRequest,
      Project,
      UserTask,

    ]),
  ],
  controllers: [
    WalletController,
    TransactionController,
    ScoreValueController,
    ManualWithdrawalRequestController,
  ],
  providers: [
    WalletService,
    ScoreValueService,
    TransactionService,
    SantimpaySdk,
    PayoutReconciliationService,
    ManualWithdrawalRequestService,
  ],
  exports: [WalletService, ScoreValueService],
})
export class FinanceModule {}
