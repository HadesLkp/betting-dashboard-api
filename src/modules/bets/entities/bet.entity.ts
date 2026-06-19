import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('bets')
export class Bet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sport: string;

  @Column()
  eventName: string;

  @Column()
  market: string;

  @Column()
  selection: string;

  @Column('decimal', { precision: 10, scale: 2 })
  odds: number;

  @Column('decimal', { precision: 10, scale: 2 })
  stake: number;

  @Column('decimal', { precision: 5, scale: 2 })
  estimatedProbability: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  impliedProbability: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  expectedValue: number;

  @Column({ default: 'pending' })
  result: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  profit: number;

  @CreateDateColumn()
  placedAt: Date;

  @Column({ nullable: true })
  oddsEventId: string;

  @Column({ nullable: true })
  bookmaker: string;

  @Column({ nullable: true })
  marketKey: string;

  @Column({ nullable: true })
  sportKey: string;
}