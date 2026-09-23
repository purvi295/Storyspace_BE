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
@Unique('uq_likes_story_user', ['story_uuid', 'user_id'])
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  // UUID of the story this like belongs to.
  @Column({ name: 'story_uuid', type: 'uuid' })
  story_uuid: string;

  // Maps to "user_id" column as defined in the migration
  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at: Date;

  // --- Relations ---
  @ManyToOne(() => Story, (story) => story.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_uuid', referencedColumnName: 'story_uuid' })
  story: Story;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'user_uuid' })
  user: User;
}
