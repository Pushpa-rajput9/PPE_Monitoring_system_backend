import jwt from "jsonwebtoken";

export interface TokenPayload {
  id: string;
  role: "admin" | "supervisor";
  name: string;
  site: string;
}

export const signToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = process.env.JWT_EXPIRES_IN || "8h";
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET as string;
  return jwt.verify(token, secret) as TokenPayload;
};
