import dotenv from "dotenv"
dotenv.config();
import jwt from "jsonwebtoken"


const JWT_SECRET = process.env.JWT_SECRET;

// function to generate the token from user

export const generateToken = (userId) => {
  const token = jwt.sign({ userId}, process.env.JWT_SECRET);
  return token;
}