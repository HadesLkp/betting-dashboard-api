import { Bet } from 'src/modules/bets/entities/bet.entity';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Bankroll } from '../../bankroll/entities/bankroll.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ default: 'USER' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Bet, (bet) => bet.user)
  bets: Bet[];

  @OneToMany(() => Bankroll, (bankroll) => bankroll.user)
  bankrolls: Bankroll[];
}