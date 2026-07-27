import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "admin" | "supervisor";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  site: string;
  isActive: boolean;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["admin", "supervisor"], required: true, default: "supervisor" },
    site: { type: String, required: true, default: "Main Site" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
