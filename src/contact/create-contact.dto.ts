/** CreateContactDto — add class-validator decorators after installing class-validator package */
export class CreateContactDto {
  name!: string;
  email!: string;
  phone?: string;
  subject?: string;
  message!: string;
}
