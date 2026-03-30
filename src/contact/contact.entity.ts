import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class ContactSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  submittedAt: Date;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  subject: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  isRead: boolean;
}
