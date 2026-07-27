import { Response } from "express";
import asyncHandler from "express-async-handler";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

// GET /api/users  (admin only) - list supervisors
export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await User.find({ role: "supervisor" }).sort({ createdAt: -1 });
  res.json(users);
});

// POST /api/users (admin only) - create a supervisor
export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password, site } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409);
    throw new Error("A user with this email already exists");
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: "supervisor",
    site: site || "Main Site",
  });

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    site: user.site,
  });
});

// PATCH /api/users/:id/status (admin only) - activate/deactivate supervisor
export const updateUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.isActive = !!isActive;
  await user.save();
  res.json({ id: user.id, isActive: user.isActive });
});

// DELETE /api/users/:id (admin only)
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ message: "Supervisor removed" });
});
