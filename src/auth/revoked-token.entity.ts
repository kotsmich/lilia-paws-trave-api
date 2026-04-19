import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class RevokedToken {
  @PrimaryColumn()
  jti: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
