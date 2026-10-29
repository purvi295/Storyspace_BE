// src/repositories/refresh-token.repository.ts
// Database repository handling refresh token persistence and status updates

import { EntityManager, Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { RefreshToken } from '../entities/refresh-token.entity';

export class RefreshTokenRepository {
  private repository: Repository<RefreshToken> = AppDataSource.getRepository(RefreshToken);

  private getRepo(manager?: EntityManager): Repository<RefreshToken> {
    return manager ? manager.getRepository(RefreshToken) : this.repository;
  }

  /**
   * Save a newly issued refresh token
   */
  async create(
    data: {
      user_uuid: string;
      token_hash: string;
      expires_at: Date;
    },
    manager?: EntityManager
  ): Promise<RefreshToken> {
    const repo = this.getRepo(manager);
    const tokenRecord = repo.create({
      ...data,
      is_revoked: false,
    });
    return repo.save(tokenRecord);
  }

  /**
   * Find a token record by its SHA-256 hash
   */
  async findByTokenHash(
    token_hash: string,
    manager?: EntityManager
  ): Promise<RefreshToken | null> {
    return this.getRepo(manager).findOne({
      where: { token_hash },
      relations: { user: true },
    });
  }

  /**
   * Mark a specific token as revoked (used during token rotation or single logout)
   */
  async revokeByTokenHash(
    token_hash: string,
    manager?: EntityManager
  ): Promise<void> {
    await this.getRepo(manager).update(
      { token_hash },
      { is_revoked: true }
    );
  }

  /**
   * Revoke all active refresh tokens for a user (security measure on password change or reuse detection)
   */
  async revokeAllForUser(
    user_uuid: string,
    manager?: EntityManager
  ): Promise<void> {
    await this.getRepo(manager).update(
      { user_uuid, is_revoked: false },
      { is_revoked: true }
    );
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
