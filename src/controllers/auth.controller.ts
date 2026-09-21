import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  // Register new user
  async register(req: Request, res: Response) {
    try {
      const { email, password, username, fullName } = req.body;

      // Validate required fields
      if (!email || !password || !username || !fullName) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const result = await authService.register({
        email,
        password,
        username,
        fullName,
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: result.user,
        token: result.token,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Login user
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await authService.login({ email, password });

      res.status(200).json({
        message: 'Login successful',
        user: result.user,
        token: result.token,
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  // Get current authenticated user profile
  async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await authService.getUserById(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;

      res.status(200).json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();
