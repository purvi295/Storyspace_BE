import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { ROLES } from '../config/constants';
import { Story } from './story.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { Follow } from './follow.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  password: string;

  @Column({ type: 'varchar', length: 150 })
  full_name: string;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatar_url: string | null;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 50, default: ROLES.USER })
  role: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at: Date;

  // --- Relations ---

  // One User can write many Stories
  @OneToMany(() => Story, (story) => story.author)
  stories: Story[];

  // One User can write many Comments
  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  // One User can give many Likes
  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  // People this user is following (follower_id = this user)
  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  // People who follow this user (following_id = this user)
  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Follow[];
}