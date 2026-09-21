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
import { Story } from './story.entity';

@Entity({ name: 'likes' })
@Unique('uq_likes_story_user', ['story_id', 'user_id'])
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  // Maps to "story_id" column as defined in the migration
  @Column({ name: 'story_id' })
  story_id: number;

  // Maps to "user_id" column as defined in the migration
  @Column({ name: 'user_id' })
  user_id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at: Date;

  // --- Relations ---
  @ManyToOne(() => Story, (story) => story.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_id' })
  story: Story;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
