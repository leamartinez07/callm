import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserDoc extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  bio?: string;
  emailVerified: boolean;
  verificationToken?: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    avatar: { type: String },
    bio: { type: String, maxlength: 200 },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    googleId: { type: String, sparse: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = ret as any;
        delete r.password;
        delete r.__v;
        return ret;
      },
    },
  }
);

UserSchema.index({ email: 1 });

const User: Model<IUserDoc> =
  mongoose.models.User ?? mongoose.model<IUserDoc>("User", UserSchema);

export default User;
