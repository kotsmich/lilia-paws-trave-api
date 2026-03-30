/** CreateTripRequestDto — add class-validator decorators after installing class-validator package */
export interface DogDto {
  id: string;
  name: string;
  size: 'small' | 'medium' | 'large';
  age: number;
  chipId: string;
  pickupLocation: string;
  dropLocation: string;
  notes: string;
}

export class CreateTripRequestDto {
  requesterName!: string;
  requesterEmail!: string;
  requesterPhone!: string;
  tripId!: string;
  dogs!: DogDto[];
}
