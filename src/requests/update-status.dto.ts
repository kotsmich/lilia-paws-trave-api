/** UpdateStatusDto — add class-validator decorators after installing class-validator package */
export class UpdateStatusDto {
  status!: 'pending' | 'approved' | 'rejected';
}
