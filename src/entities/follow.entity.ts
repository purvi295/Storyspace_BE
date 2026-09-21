import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

import { User } from './user.entity';

@Entity({ name: 'follows' })
@Unique('uq_follows_follower_following', ['follower_id', 'following_id'])
export class Follow {
  @PrimaryGeneratedColumn()
  id: number;

  // Maps to "follower_id" column (the user who is following)
  @Column({ name: 'follower_id' })
  follower_id: number;

  // Maps to "following_id" column (the user being followed)
  @Column({ name: 'following_id' })
  following_id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at: Date;

  // --- Relations ---
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following: User;
}
