import { Request, Response } from 'express';
import { userRepository } from '../repositories/user.repository';

export class UserController {
  // Get public profile by username with follower/following counts
  async getPublicProfile(req: Request, res: Response) {
    try {
      const { username } = req.params;

      if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: 'Username is required' });
      }

      const user = await userRepository.findByUsername(username);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get follower and following counts
      const followerCount = await userRepository.getFollowerCount(user.id);
      const followingCount = await userRepository.getFollowingCount(user.id);

      // Return user without password and with counts
      const { password, ...userWithoutPassword } = user;

      res.status(200).json({
        user: {
          ...userWithoutPassword,
          followerCount,
          followingCount,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update own profile
  async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { bio, avatar_url, full_name } = req.body;

      const updatedUser = await userRepository.updateProfile(req.user.id, {
        bio,
        avatar_url,
        full_name,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;

      res.status(200).json({
        message: 'Profile updated successfully',
        user: userWithoutPassword,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const userController = new UserController();
