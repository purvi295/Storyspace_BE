import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Story } from './story.entity';

@Entity({ name: 'comments' })
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  // UUID of the story this comment belongs to.
  @Column({ name: 'story_uuid', type: 'uuid' })
  story_uuid: string;

  // Maps to "user_id" column as defined in the migration
  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at: Date;

  // --- Relations ---
  @ManyToOne(() => Story, (story) => story.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_uuid', referencedColumnName: 'story_uuid' })
  story: Story;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
