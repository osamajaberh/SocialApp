import { v2 as cloudinary } from "cloudinary";
import path from "node:path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.resolve("./src/config/.env.dev") });

// Validate required environment variables
const requiredEnvVars = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(` Missing required ENV variable: ${varName}`);
    process.exit(1); // Exit app if important ENV is missing
  }
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Export both cloudinary instance and app name
export const APP_NAME = process.env.APP_NAME || "SocialApp";
export default cloudinary;