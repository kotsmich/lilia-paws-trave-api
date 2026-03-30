import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, Index } from 'typeorm';

@Entity()
export class ContactSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  submittedAt: Date;

  // Soft-delete: records are hidden from queries unless withDeleted() is used
  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

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

  @Index()
  @Column({ default: false })
  isRead: boolean;
}
