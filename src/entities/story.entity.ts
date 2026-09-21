import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import { STORY_STATUS, STORY_VISIBILITY } from '../config/constants';
import { User } from './user.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';

@Entity({ name: 'stories' })
export class Story {
  @PrimaryGeneratedColumn()
  id: number;

  // Maps to "authorId" column as defined in the migration
  @Column({ name: 'authorId' })
  authorId: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 300, unique: true })
  slug: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  summary: string;

  // Maps to "coverImageUrl" column as defined in the migration
  @Column({ name: 'coverImageUrl', type: 'varchar', length: 500, nullable: true })
  coverImageUrl: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: STORY_STATUS.DRAFT,
  })
  status: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: STORY_VISIBILITY.PUBLIC,
  })
  visibility: string;

  // Maps to "rejectionReason" column as defined in the migration
  @Column({ name: 'rejectionReason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  published_at: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at: Date;

  // --- Relations ---
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToMany(() => Comment, (comment) => comment.story)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.story)
  likes: Like[];
}
