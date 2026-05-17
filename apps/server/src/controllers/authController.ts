// localhost me use karne ke liye samesite: "lax" karna hoga

import { CreateUserSchema, SigninSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import bcryptjs from "bcryptjs"
import { Request,Response } from "express";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

export const signupController =  async (req:Request, res:Response) => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect Inputs"
    })
    return;
  }

    const trimmedPassword = parsedData.data.password.trim();
    const regex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,}$/;

    if (!regex.test(trimmedPassword)) {
      res.status(400).json({ message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' });
      return;
    }

    const existingUser =  await prismaClient.user.findFirst({
      where: {
        email: {
          equals: parsedData.data.email,
          mode: "insensitive"
        }
      }
    })
    if (existingUser) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }

  try {
    const hashedPassword = await bcryptjs.hash(trimmedPassword, 10);
    const user = await prismaClient.user.create({
      data: {
        email: parsedData.data.email.toLowerCase(),
        password: hashedPassword,
        name: parsedData.data.name
      }
    })
    res.status(201).json({
  message: "Register Successful",
  userId: user.id
});

  } catch (e) {
    res.status(409).json({
      message: "User already exists with this username"
    })
  }
}

export const loginController = async (req:Request, res:Response) => {
  const parsedData = SigninSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect Inputs"
    })
    return;
  }

  try {

    const user = await prismaClient.user.findFirst({
      where: {
        email: {
          equals: parsedData.data.email,
          mode: "insensitive"
        }
      }
    })

    if (!user) {
      res.status(401).json({
        message: "Not authorized"
      })
      return;
    }

    const passwordMatch = await bcryptjs.compare(parsedData.data.password.trim(), user.password);
    if (!passwordMatch) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({
      userId: user.id
    }, process.env.JWT_SECRET as string,{expiresIn:"1h"})

    const refreshTokenString = jwt.sign({
      userId: user.id
    }, process.env.JWT_REFRESH_SECRET as string || "fallback_refresh_secret", { expiresIn: "7d" });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prismaClient.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt
      }
    });

    res.cookie("token",token,{
      httpOnly:true,
      secure:process.env.NODE_ENV === "production",
      sameSite:"lax",
      maxAge: 60*60*1000
    })

    res.cookie("refreshToken", refreshTokenString, {
      httpOnly:true,
      secure:process.env.NODE_ENV === "production",
      sameSite:"lax",
      maxAge: 7*24*60*60*1000
    })

    res.json({
      message: "Login Successful"
    })
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }

}

export const logoutController = async (req:Request, res:Response) => {
  const refreshTokenString = req.cookies.refreshToken;

  if (refreshTokenString) {
    try {
      await prismaClient.refreshToken.delete({
        where: { token: refreshTokenString }
      });
    } catch (e) {
      console.error("Error deleting refresh token", e);
    }
  }

  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.json({ message: "Logged out" });
}

export const myInfoController = async(req:Request, res:Response) => {
    try {
          const userId = req.userId;
  if (typeof userId !== "number") {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const result = await prismaClient.user.findUnique({
    where:{
      id: userId
    }
  })

  if (!result) {
  res.status(404).json({ message: "User not found" });
  return;
}

  res.json({
      user:{
          id: result.id,
          name: result?.name
      }
  })
  } catch (e) {
console.error("myInfoController error:", e);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const refreshTokenController = async (req: Request, res: Response) => {
  const refreshTokenString = req.cookies.refreshToken;
  
  if (!refreshTokenString) {
    res.status(401).json({ message: "No refresh token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(refreshTokenString, process.env.JWT_REFRESH_SECRET as string || "fallback_refresh_secret") as { userId: number };
    
    const tokenRecord = await prismaClient.refreshToken.findUnique({
      where: { token: refreshTokenString }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      res.status(403).json({ message: "Invalid or expired refresh token" });
      return;
    }

    const token = jwt.sign({
      userId: decoded.userId
    }, process.env.JWT_SECRET as string, { expiresIn: "1h" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000
    });

    res.json({ message: "Token refreshed successfully" });
  } catch (e) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};