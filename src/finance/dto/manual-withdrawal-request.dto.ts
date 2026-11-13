
import {
  IsEnum,
  IsNumber,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ManualWithdrawalPaymentMethod {
  TELEBIRR = 'Telebirr',
  CBE_BIRR = 'CBE Birr',
}

export class CreateManualWithdrawalRequestDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100000)
  amount: number;

  @IsEnum(ManualWithdrawalPaymentMethod)
  payment_method: ManualWithdrawalPaymentMethod;

  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/, {
    message: 'Please provide a valid phone number.',
  })
  phone_number: string;

  @IsString()
  project_id: string;
}

export class RejectManualWithdrawalRequestDto {
  @IsString()
  rejection_reason: string;
}
