import { IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsIn(['pending', 'approved', 'rejected'])
  status!: 'pending' | 'approved' | 'rejected';
}
