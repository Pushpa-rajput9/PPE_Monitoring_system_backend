import { Response } from "express";
import asyncHandler from "express-async-handler";
import User from "../models/User";
import { signToken } from "../utils/jwt";
import { AuthRequest } from "../middleware/auth";

// POST /api/auth/login
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const match = await user.comparePassword(password);
  if (!match) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const token = signToken({
    id: user.id,
    role: user.role,
    name: user.name,
    site: user.site,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      site: user.site,
    },
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    site: user.site,
  });
});
