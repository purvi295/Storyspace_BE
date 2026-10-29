// src/services/auth.service.ts
// Business logic for authentication, password hashing, JWT generation, and Refresh Token rotation/revocation

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../entities/user.entity";
import { LoginDto, RegisterDto } from "../dtos/auth.dto";
import { authRepository } from "../repositories/auth.repository";
import { refreshTokenRepository } from "../repositories/refresh-token.repository";
import ApiError from "../utils/api.error";
import { AppDataSource } from "../database/data-source";
import config from "../config/env.config";

const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRES_IN = config.jwt.expiresIn;
const JWT_REFRESH_SECRET = config.jwt.refreshSecret;
const JWT_REFRESH_EXPIRES_IN = config.jwt.refreshExpiresIn;

export interface JwtUserPayload {
  user_uuid: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  user_uuid: string;
  jti: string; // Unique JWT Token ID for token tracking
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: Partial<User>;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Hashes a raw plain-text password using bcrypt with a salt factor of 10
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Securely compares plain text password against stored bcrypt hash
   */
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generates a cryptographic SHA-256 hash of a string
   */
  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Generates a short-lived Access Token (e.g., 15 minutes)
   */
  generateAccessToken(user: User): string {
    const payload: JwtUserPayload = {
      user_uuid: user.user_uuid,
      email: user.email,
      username: user.username,
      role: user.role,
    };
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Generates a long-lived Refresh Token (e.g., 7 days) and stores its SHA-256 hash in DB
   */
  async generateRefreshToken(user: User): Promise<string> {
    const jti = crypto.randomUUID();
    const payload: JwtRefreshPayload = {
      user_uuid: user.user_uuid,
      jti,
    };

    const token = jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);

    // Calculate expiration date for database record (7 days from now)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Store only the SHA-256 hash in the database
    await refreshTokenRepository.create({
      user_uuid: user.user_uuid,
      token_hash: this.hashToken(token),
      expires_at: expiresAt,
    });

    return token;
  }

  /**
   * Convenience helper to generate both Access and Refresh tokens
   */
  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    return { accessToken, refreshToken };
  }

  /**
   * Legacy alias for generateAccessToken
   */
  generateToken(user: User): string {
    return this.generateAccessToken(user);
  }

  /**
   * Verifies an Access Token against JWT_SECRET
   */
  verifyToken(token: string): JwtUserPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtUserPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verifies a Refresh Token against JWT_REFRESH_SECRET
   */
  verifyRefreshToken(token: string): JwtRefreshPayload | null {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as JwtRefreshPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Rotates a Refresh Token: Validates, revokes old token, and issues a new pair
   */
  async refreshAccessToken(rawRefreshToken: string): Promise<AuthResponse> {
    if (!rawRefreshToken) {
      throw ApiError.badRequest("Refresh token is required");
    }

    // 1. Verify cryptographic JWT signature
    const payload = this.verifyRefreshToken(rawRefreshToken);
    if (!payload) {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    // 2. Hash token to look up in DB
    const tokenHash = this.hashToken(rawRefreshToken);
    const tokenRecord = await refreshTokenRepository.findByTokenHash(tokenHash);

    if (!tokenRecord) {
      throw ApiError.unauthorized("Refresh token not found");
    }

    // 3. SECURITY: Token Reuse Detection
    // If a revoked refresh token is presented, an attacker may have compromised this token!
    // Invalidate ALL tokens belonging to this user immediately.
    if (tokenRecord.is_revoked) {
      await refreshTokenRepository.revokeAllForUser(tokenRecord.user_uuid);
      throw ApiError.unauthorized(
        "Security Alert: Compromised refresh token detected. All active sessions have been revoked."
      );
    }

    // 4. Verify DB-level expiration
    if (new Date() > new Date(tokenRecord.expires_at)) {
      throw ApiError.unauthorized("Refresh token has expired");
    }

    // 5. Revoke the old refresh token (Token Rotation guarantee)
    await refreshTokenRepository.revokeByTokenHash(tokenHash);

    // 6. Fetch the user
    const user = await authRepository.findByUuid(tokenRecord.user_uuid);
    if (!user) {
      throw ApiError.notFound("User no longer exists");
    }

    // 7. Generate a new token pair
    const tokens = await this.generateTokens(user);

    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Register a new user
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    const { email, password, username, full_name } = data;

    const existingUser = await authRepository.findByEmailOrUsername(
      email,
      username,
    );

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ApiError(
          409,
          "An account with this email address already exists",
        );
      }
      if (existingUser.username === username) {
        throw new ApiError(409, "This username is already taken");
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedUser = await authRepository.create(
        {
          email,
          password: hashedPassword,
          username,
          full_name,
          role: "user",
        },
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();

      // Generate both access and refresh tokens
      const tokens = await this.generateTokens(savedUser);

      const { password: _, ...userWithoutPassword } = savedUser;
      return {
        user: userWithoutPassword,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Authenticate a user via email and password
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    const { email, password } = data;

    const user = await authRepository.findByEmail(email);

    if (!user) {
      throw ApiError.unauthorized("Invalid email");
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid password");
    }

    // Generate access & refresh tokens
    const tokens = await this.generateTokens(user);

    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Logout user and revoke tokens
   */
  async logout(userUuid: string, rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      // Revoke this specific refresh token
      const tokenHash = this.hashToken(rawRefreshToken);
      await refreshTokenRepository.revokeByTokenHash(tokenHash);
    } else {
      // Revoke all refresh tokens for this user
      await refreshTokenRepository.revokeAllForUser(userUuid);
    }

    // Invalidate access tokens issued prior to this moment
    await authRepository.updateLastLogoutAt(userUuid);
  }

  /**
   * Get user by UUID
   */
  async getUserByUuid(user_uuid: string): Promise<User | null> {
    return authRepository.findByUuid(user_uuid);
  }
}

export const authService = new AuthService();
