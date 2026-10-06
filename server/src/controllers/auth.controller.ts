import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';
import { config } from '../config/env.config';

export class AuthController {
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
          errors: ['Email already registered'],
        });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = new User({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role || 'reviewer',
      });
      await user.save();

      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        errors: [error.message],
      });
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials',
          errors: ['User not found'],
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials',
          errors: ['Invalid password'],
        });
        return;
      }

      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Login process error',
        errors: [error.message],
      });
    }
  }

  public async getMe(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.user?.userId).select('-passwordHash');
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User profile not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Could not fetch user profile',
        errors: [error.message],
      });
    }
  }
}

export const authController = new AuthController();
