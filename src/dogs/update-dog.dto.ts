/** UpdateDogDto — add class-validator decorators after installing class-validator package */
export class UpdateDogDto {
  name?: string;
  size?: 'small' | 'medium' | 'large';
  age?: number;
  chipId?: string;
  pickupLocation?: string;
  dropLocation?: string;
  notes?: string;
}
