import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export const requireRole = (...roles: Array<"admin" | "supervisor">) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role permissions" });
    }
    next();
  };
};
