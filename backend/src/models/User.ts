import mongoose, { HydratedDocument, Model, Schema } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  password: string;
  profileImageUrl: string;
}

type UserDocument = HydratedDocument<IUser>;
type UserModel = Model<IUser>;

const UserSchema = new Schema<IUser, UserModel>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser, UserModel>("User", UserSchema);

export default User;
export type { UserDocument };
