import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('bankroll_history')
export class BankrollHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bankrollId: number;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 12, scale: 2 })
  profit: number;

  @Column({ nullable: true })
  betId: number;

  @CreateDateColumn()
  createdAt: Date;
}