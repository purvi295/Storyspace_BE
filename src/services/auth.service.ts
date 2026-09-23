import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/user.entity";
import { EditAuthProfileDto, LoginDto, RegisterDto } from "../dtos/auth.dto";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

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
    const { email, password, username, fullName } = data;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new Error("User with this email or username already exists");
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create new user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      username,
      full_name: fullName,
      role: "user",
    });

    await this.userRepository.save(user);

    // Generate token
    const token = this.generateToken(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  // Login user
  async login(data: LoginDto): Promise<{ user: Partial<User>; token: string }> {
    const { email, password } = data;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Generate token
    const token = this.generateToken(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  // Get user by its UUID primary key
  async getUserByUuid(user_uuid: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { user_uuid },
    });
  }

  async editProfile(
    userUuid: string,
    updateData: EditAuthProfileDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { user_uuid: userUuid } });

    if (!user) {
      throw new Error("User not found");
    }

    // Update only the allowed fields
    Object.assign(user, updateData);

    // If username is changing, verify it doesn't conflict with another user
    if (updateData.username && user.username !== updateData.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateData.username },
      });
      if (existingUser) {
        throw new Error("Username already taken");
      }
    }

    await this.userRepository.save(user);
    return user;
  }
}

export const authService = new AuthService();
