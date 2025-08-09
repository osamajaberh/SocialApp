
import { roleTypes } from "../../../constants/constants.js";
import { UserModel } from "../../../DB/models/User.model.js";
import { emailEvent } from "../../../utils/events/email.event.js";
import { asyncHandller } from "../../../utils/response/error.response.js";
import { successResponse } from "../../../utils/response/success.response.js";
import { compareHash, generateHash } from "../../../utils/security/hash.security.js";
import { generateToken, verifyToken } from "../../../utils/security/token.security.js";
// import {OAuth2Client} from 'google-auth-library';
import * as dbService from "../../../DB/db.service.js"



export const login = asyncHandller(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Find user by email and include password
  const user = await dbService.findOne({
    model: UserModel,
    filter: { email },
    select: "+password" // in case password is excluded by default
  });

  if (!user) {
    return next(new Error("Wrong email or password", { cause: 404 }));
  }

  if (!user.confirmEmail) {
    return next(new Error("Please verify your email before logging in", { cause: 400 }));
  }

  // 2. Verify password
  const isPasswordMatch = await compareHash({ plainText: password, hashValue: user.password });

  if (!isPasswordMatch) {
    return next(new Error("Wrong email or password", { cause: 401 }));
  }

  // 3. Generate tokens
  const tokenPayload = { id: user._id, role: user.role };

  const accessToken = generateToken({
    payload: tokenPayload,
    signature:
      user.role === roleTypes.admin
        ? process.env.ADMIN_ACCESS_TOKEN
        : process.env.USER_ACCESS_TOKEN,
    expiresIn: process.env.ACCESS_EXPIRES_IN || "1h",
  });

  const refreshToken = generateToken({
    payload: tokenPayload,
    signature:
      user.role === roleTypes.admin
        ? process.env.ADMIN_REFRESH_TOKEN
        : process.env.USER_REFRESH_TOKEN,
    expiresIn: process.env.REFRESH_EXPIRES_IN || "7d",
  });

  // 4. Send response
  return successResponse({
    res,
    message: "Logged in successfully",
    data: {
      Token: { accessToken, refreshToken },
      user: { id: user._id, email: user.email, role: user.role } // optional
    },
  });
});
// export const loginWithGmail = asyncHandller(async (req, res, next) => {
//     const {idToken} = req.body;
    

    
  
// const client = new OAuth2Client();
// async function verify() {
//   const ticket = await client.verifyIdToken({
//       idToken,
//       audience:process.env.CLIENT_ID,  // Specify the WEB_CLIENT_ID of the app that accesses the backend
//       // Or, if multiple clients access the backend:
//       //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
//   });
//   const payload = ticket.getPayload();
//  return payload
// }
// const payload = await  verify()










//     // ✅ Use env expiration settings
//     // const accessToken = generateToken({
//     //     payload: { id: user._id, role: user.role },
//     //     signature: user.role === roleTypes.admin
//     //         ? process.env.ADMIN_ACCESS_TOKEN
//     //         : process.env.USER_ACCESS_TOKEN,
//     //     expiresIn: process.env.ACCESS_EXPIRES_IN || "1h"
//     // });

//     // const refreshToken = generateToken({
//     //     payload: { id: user._id, role: user.role },
//     //     signature: user.role === roleTypes.admin
//     //         ? process.env.ADMIN_REFRESH_TOKEN
//     //         : process.env.USER_REFRESH_TOKEN,
//     //     expiresIn: process.env.REFRESH_EXPIRES_IN || "7d"
//     // });

//     return successResponse({
//         res,
//         message: "Logged in successfully",
//         data: { payload }
//     });
// });


export const refreshToken = asyncHandller(async (req, res, next) => {
  const { authorization } = req.headers;

  // 1. Extract token from header
  const [bearer, token] = authorization?.split(" ") || [];
  if (!bearer || !token) {
    return next(new Error("Missing token", { cause: 400 }));
  }

  // 2. Determine correct signature
  let signature = "";
  switch (bearer) {
    case "System":
      signature = process.env.ADMIN_REFRESH_TOKEN;
      break;
    case "Bearer":
      signature = process.env.USER_REFRESH_TOKEN;
      break;
    default:
      return next(new Error("Invalid token type", { cause: 400 }));
  }

  // 3. Verify token
  let decoded;
  try {
    decoded = verifyToken({ token, signature });
  } catch (err) {
    return next(new Error("Invalid or expired token", { cause: 401 }));
  }

  if (!decoded?.id) {
    return next(new Error("Invalid token payload", { cause: 401 }));
  }

  // 4. Find user using dbService
  const user = await dbService.findOne({
    model: UserModel,
    filter: { _id: decoded.id, isDeleted: false },
  });

  if (!user) {
    return next(new Error("Account not found", { cause: 404 }));
  }

  // 5. Ensure token is still valid (not invalidated by credential changes)
  const tokenIssuedAt = decoded.iat * 1000;
  const credentialsChangedAt = user.changeCredentialsTime?.getTime() || 0;

  if (credentialsChangedAt >= tokenIssuedAt) {
    return next(new Error("Token invalid due to recent credential change", { cause: 400 }));
  }

  // 6. Generate new tokens
  const accessToken = generateToken({
    payload: { id: user._id, role: user.role },
    signature:
      user.role === roleTypes.admin
        ? process.env.ADMIN_ACCESS_TOKEN
        : process.env.USER_ACCESS_TOKEN,
    expiresIn: process.env.ACCESS_EXPIRES_IN || "1h",
  });

  const newRefreshToken = generateToken({
    payload: { id: user._id, role: user.role },
    signature:
      user.role === roleTypes.admin
        ? process.env.ADMIN_REFRESH_TOKEN
        : process.env.USER_REFRESH_TOKEN,
    expiresIn: process.env.REFRESH_EXPIRES_IN || "7d",
  });

  // 7. Send new tokens
  return successResponse({
    res,
    message: "Token refreshed successfully",
    data: {
      token: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    },
  });
});

export const forgetPassword = asyncHandller(async (req, res, next) => {
  const { email } = req.body;

  // 1. Find the user by email and ensure not deleted
  const user = await dbService.findOne({
    model: UserModel,
    filter: { email, isDeleted: false },
  });

  if (!user) {
    return next(new Error("Invalid Email", { cause: 404 }));
  }

  // 2. Ensure email is confirmed
  if (!user.confirmEmail) {
    return next(new Error("Verify your account first", { cause: 400 }));
  }

  // 3. Trigger email event to send OTP
  emailEvent.emit("forgotPassword", { email });

  return successResponse({
    res,
    message: "OTP sent successfully",
  });
});
export const validateForgetPassword = asyncHandller(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new Error("Email and OTP are required", { cause: 400 }));
  }

  const user = await dbService.findOne({
    model: UserModel,
    filter: { email, isDeleted: false }
  });

  if (!user) {
    return next(new Error("Invalid email", { cause: 404 }));
  }

  const now = new Date();
  const OTP_EXPIRY_MS = 2 * 60 * 1000;       // 2 minutes
  const BLOCK_DURATION_MS = 60 * 60 * 1000;  // 1 hour
  const MAX_TRIES = 5;

  // Blocked check
  if (user.confirmEmailOTPBlockedUntil && user.confirmEmailOTPBlockedUntil > now) {
    const waitMinutes = Math.ceil((user.confirmEmailOTPBlockedUntil - now) / 60000);
    return next(new Error(`Too many attempts. Try again in ${waitMinutes} minutes.`, { cause: 429 }));
  }

  // OTP Expiry check
  if (!user.confirmEmailOTPCreatedAt || now - user.confirmEmailOTPCreatedAt > OTP_EXPIRY_MS) {
    return next(new Error("OTP expired. Please request a new one.", { cause: 400 }));
  }

  const isMatch = await compareHash({ plainText: otp, hashValue: user.confirmEmailOTP });

  if (!isMatch) {
    user.confirmEmailOTPTries += 1;

    if (user.confirmEmailOTPTries >= MAX_TRIES) {
      user.confirmEmailOTPBlockedUntil = new Date(now.getTime() + BLOCK_DURATION_MS);
    }

    await user.save();
    return next(new Error(`Invalid code. Attempt ${user.confirmEmailOTPTries}/${MAX_TRIES}`, { cause: 400 }));
  }

  // OTP is valid - allow password reset
  user.confirmEmailOTPTries = 0;
  user.confirmEmailOTP = undefined;
  user.confirmEmailOTPCreatedAt = undefined;
  user.confirmEmailOTPBlockedUntil = undefined;
  user.lastOTPRequestAt = undefined;

  user.canResetPassword = true;
  user.resetPasswordExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

  await user.save();

  return successResponse({ res, message: "OTP validated. You can now reset your password." });
});

export const resetPassword = asyncHandller(async (req, res, next) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return next(new Error("Email and new password are required", { cause: 400 }));
    }

    const user = await dbService.findOne({
        model: UserModel,
        filter: { email, isDeleted: false }
    });

    if (!user) {
        return next(new Error("Invalid email", { cause: 404 }));
    }

    const now = new Date();

    // Check if password reset session is valid and not expired
    if (!user.canResetPassword || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < now) {
        return next(new Error("Password reset session expired or not validated.", { cause: 400 }));
    }

    //  Hash and update new password, cleanup reset fields
    user.password = newPassword
    user.canResetPassword = false;
    user.resetPasswordExpiresAt = undefined;
    user.changeCredentialsTime = now; //  Invalidate old tokens

    await user.save();

    return successResponse({ res, message: "Password reset successfully." });
});
