import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { env } from '../config/env';

function signAccessToken(id: string, email: string, role: string): string {
  return jwt.sign({ id, email, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function signRefreshToken(id: string): string {
  return jwt.sign({ id }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const exists = await UserModel.findOne({ email: email.toLowerCase() });
  if (exists) {
    throw createError('Email already registered', 409);
  }

  const user = new UserModel({ name, email, passwordHash: password });
  await user.save();

  const accessToken = signAccessToken(String(user._id), user.email, user.role);
  const refreshToken = signRefreshToken(String(user._id));

  user.refreshToken = refreshToken;
  await user.save();

  res.status(201).json({
    success: true,
    data: { user, accessToken, refreshToken },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+passwordHash +refreshToken');
  if (!user || !user.isActive) {
    throw createError('Invalid credentials', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw createError('Invalid credentials', 401);
  }

  const accessToken = signAccessToken(String(user._id), user.email, user.role);
  const refreshToken = signRefreshToken(String(user._id));

  user.refreshToken = refreshToken;
  await user.save();

  res.json({
    success: true,
    data: { user, accessToken, refreshToken },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw createError('Refresh token required', 400);
  }

  let decoded: { id: string };
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { id: string };
  } catch {
    throw createError('Invalid or expired refresh token', 401);
  }

  const user = await UserModel.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw createError('Refresh token mismatch', 401);
  }

  const newAccessToken = signAccessToken(String(user._id), user.email, user.role);
  const newRefreshToken = signRefreshToken(String(user._id));

  user.refreshToken = newRefreshToken;
  await user.save();

  res.json({
    success: true,
    data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await UserModel.findById(req.user!.id);
  if (!user) throw createError('User not found', 404);
  res.json({ success: true, data: user });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  await UserModel.findByIdAndUpdate(req.user!.id, { refreshToken: undefined });
  res.json({ success: true, message: 'Logged out' });
});
