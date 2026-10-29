// src/entities/refresh-token.entity.ts
// Entity for managing persistent, revocable refresh tokens

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'refresh_tokens' })
export class RefreshToken {
  // Unique UUID identifier for the token record
  @PrimaryColumn({
    name: 'token_id',
    type: 'uuid',
    default: () => 'gen_random_uuid()',
  })
  token_id!: string;

  // UUID of the user who owns this token
  @Column({ name: 'user_uuid', type: 'uuid' })
  @Index('idx_refresh_tokens_user_uuid')
  user_uuid!: string;

  // SHA-256 hash of the raw refresh token string (never store plain tokens in DB)
  @Column({ name: 'token_hash', type: 'varchar', length: 64, unique: true })
  @Index('idx_refresh_tokens_token_hash')
  token_hash!: string;

  // Revocation flag: if true, this token cannot be used again
  @Column({ name: 'is_revoked', type: 'boolean', default: false })
  is_revoked!: boolean;

  // Expiration timestamp
  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  expires_at!: Date;

  // Creation timestamp
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at!: Date;

  // Last update timestamp
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at!: Date;

  // --- Relations ---
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_uuid', referencedColumnName: 'user_uuid' })
  user!: User;
}
