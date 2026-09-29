import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../entities/user.entity";
import { LoginDto, RegisterDto } from "../dtos/auth.dto";
import { authRepository } from "../repositories/auth.repository";
import ApiError from "../utils/api.error";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

export class AuthService {
  // Hash password
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Compare password
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  generateToken(user: User): string {
    const payload = {
      user_uuid: user.user_uuid,
      email: user.email,
      username: user.username,
      role: user.role,
    };
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  // Verify JWT token
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Register user
  async register(data: RegisterDto): Promise<{ user: Partial<User>; token: string }> {
    const { email, password, username, full_name } = data;

    const existingUser = await authRepository.findByEmailOrUsername(
      email,
      username,
    );

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ApiError(409, "An account with this email address already exists");
      }
      if (existingUser.username === username) {
        throw new ApiError(409, "This username is already taken");
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    const user = await authRepository.create({
      email,
      password: hashedPassword,
      username,
      full_name,
      role: "user",
    });

    // Generate token
    const token = this.generateToken(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  // Login user
  async login(data: LoginDto): Promise<{ user: Partial<User>; token: string }> {
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

    // Generate token
    const token = this.generateToken(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  // Get user by its UUID primary key
  async getUserByUuid(user_uuid: string): Promise<User | null> {
    return authRepository.findByUuid(user_uuid);
  }
}

export const authService = new AuthService();
