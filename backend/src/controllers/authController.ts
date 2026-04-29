import bcrypt from "bcryptjs";
import fs from "fs";
import { randomUUID } from "crypto";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import path from "path";
import User from "../models/User";

interface InMemoryUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  profileImageUrl?: string;
}

const uploadsDir = path.resolve(__dirname, "../../uploads");
const fallbackDataDir = path.resolve(__dirname, "../../.local-data");
const fallbackUsersFile = path.join(fallbackDataDir, "users.json");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(fallbackDataDir)) {
  fs.mkdirSync(fallbackDataDir, { recursive: true });
}

const loadInMemoryUsers = (): InMemoryUser[] => {
  try {
    if (!fs.existsSync(fallbackUsersFile)) return [];
    const raw = fs.readFileSync(fallbackUsersFile, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as InMemoryUser[]) : [];
  } catch {
    return [];
  }
};

const saveInMemoryUsers = (users: InMemoryUser[]) => {
  fs.writeFileSync(fallbackUsersFile, JSON.stringify(users, null, 2), "utf-8");
};

const inMemoryUsers: InMemoryUser[] = loadInMemoryUsers();

const isMongoConnected = () => mongoose.connection.readyState === 1;

const generateToken = (payload: { userId: string; email: string; name: string }) =>
  jwt.sign(payload, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: "Name, email and password are required." });
      return;
    }
    const normalizedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPassword = String(password);
    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      res.status(400).json({ message: "Name, email and password are required." });
      return;
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    if (!isMongoConnected()) {
      const existing = inMemoryUsers.find((u) => u.email === normalizedEmail);
      if (existing) {
        res.status(409).json({ message: "User already exists." });
        return;
      }

      const user: InMemoryUser = {
        _id: randomUUID(),
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
      };
      inMemoryUsers.push(user);
      saveInMemoryUsers(inMemoryUsers);
      const token = generateToken({ userId: user._id, email: user.email, name: user.name });
      res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email, profileImageUrl: user.profileImageUrl || "" },
      });
      return;
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ message: "User already exists." });
      return;
    }

    const newUser = await User.create({ name: normalizedName, email: normalizedEmail, password: hashedPassword });
    const token = generateToken({ userId: newUser.id, email: newUser.email, name: newUser.name });
    res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, profileImageUrl: newUser.profileImageUrl || "" },
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating user." });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required." });
      return;
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPassword = String(password);
    if (!normalizedEmail || !normalizedPassword) {
      res.status(400).json({ message: "Email and password are required." });
      return;
    }

    if (!isMongoConnected()) {
      const user = inMemoryUsers.find((u) => u.email === normalizedEmail);
      if (!user) {
        res.status(401).json({ message: "Invalid credentials. If server restarted in fallback mode, please sign up again." });
        return;
      }
      const valid = await bcrypt.compare(normalizedPassword, user.password);
      if (!valid) {
        res.status(401).json({ message: "Invalid credentials." });
        return;
      }
      const token = generateToken({ userId: user._id, email: user.email, name: user.name });
      res.status(200).json({
        token,
        user: { id: user._id, name: user.name, email: user.email, profileImageUrl: user.profileImageUrl || "" },
      });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials." });
      return;
    }

    const validPassword = await bcrypt.compare(normalizedPassword, user.password);
    if (!validPassword) {
      res.status(401).json({ message: "Invalid credentials." });
      return;
    }

    const token = generateToken({ userId: user.id, email: user.email, name: user.name });
    res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, profileImageUrl: user.profileImageUrl || "" },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in." });
  }
};

export const uploadUserProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user?: { userId?: string } }).user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }
    const { imageBase64 } = req.body as { imageBase64?: string };
    if (!imageBase64 || typeof imageBase64 !== "string") {
      res.status(400).json({ message: "imageBase64 is required." });
      return;
    }
    const matches = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!matches) {
      res.status(400).json({ message: "Invalid image format." });
      return;
    }
    const mime = matches[1];
    const base64Data = matches[2];
    const extension = mime.split("/")[1] || "png";
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
    const fileUrl = `/uploads/${filename}`;

    if (!isMongoConnected()) {
      const user = inMemoryUsers.find((item) => item._id === userId);
      if (!user) {
        res.status(404).json({ message: "User not found." });
        return;
      }
      user.profileImageUrl = fileUrl;
      saveInMemoryUsers(inMemoryUsers);
      res.status(200).json({
        user: { id: user._id, name: user.name, email: user.email, profileImageUrl: user.profileImageUrl },
      });
      return;
    }

    const user = await User.findByIdAndUpdate(userId, { profileImageUrl: fileUrl }, { new: true });
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    res.status(200).json({
      user: { id: user.id, name: user.name, email: user.email, profileImageUrl: user.profileImageUrl || "" },
    });
  } catch (error) {
    res.status(500).json({ message: "Error uploading profile image." });
  }
};
