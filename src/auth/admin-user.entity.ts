import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum AdminRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
}

@Entity()
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: AdminRole, default: AdminRole.OPERATOR })
  role: AdminRole;

  @CreateDateColumn()
  createdAt: Date;
}
