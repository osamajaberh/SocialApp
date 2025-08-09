import jwt from "jsonwebtoken";

export const generateToken = ({
  payload = {},
  signature = process.env.USER_ACCESS_TOKEN,
  expiresIn = process.env.EXPIRESIN
} = {}) => {
  const token = jwt.sign(payload, signature, {
    expiresIn // accept "1h", "7d", etc.
  });
  return token;
};

export const verifyToken = ({
  token = "",
  signature = process.env.USER_ACCESS_TOKEN
} = {}) => {
  try {
    const decoded = jwt.verify(token, signature);
    return decoded; // { id, email, role, iat, exp }
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};