import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeStructure } from './entities/fee-structure.entity';
import { FeeInvoice } from './entities/fee-invoice.entity';
import { FeePayment } from './entities/fee-payment.entity';
import { FeeSetting } from './entities/fee-setting.entity';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { User } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';
import { School } from '../schools/entities/school.entity';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeeStructure,
      FeeInvoice,
      FeePayment,
      FeeSetting,
      User,
      Class,
      School,
    ]),
    forwardRef(() => WalletModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService],
})
export class FeesModule {}
