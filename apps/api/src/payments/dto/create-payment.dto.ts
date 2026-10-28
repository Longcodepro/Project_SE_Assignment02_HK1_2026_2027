import { IsIn, IsString, Matches, ValidateIf } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  orderId!: string;

  @IsIn(['WALLET', 'CARD'])
  method!: 'WALLET' | 'CARD';

  // Chỉ cần khi trả bằng thẻ. Số thẻ không được lưu lại.
  @ValidateIf((o: CreatePaymentDto) => o.method === 'CARD')
  @Matches(/^\d{13,19}$/, { message: 'cardNumber must be 13-19 digits' })
  cardNumber?: string;
}
