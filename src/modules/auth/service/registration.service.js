import { customAlphabet } from "nanoid";
import { UserModel } from "../../../DB/models/User.model.js";
import { emailEvent } from "../../../utils/events/email.event.js";
import { asyncHandller } from "../../../utils/response/error.response.js";
import { successResponse } from "../../../utils/response/success.response.js";
import { compareHash, generateHash } from "../../../utils/security/hash.security.js";
import { sendNewOTP } from "../../../utils/email/resend-otp.js";
import * as dbService  from"../../../DB/db.service.js"


export const signUp = asyncHandller(async (req, res, next) => {
  const { userName, email, password } = req.body;

  const existingUser = await dbService.findOne({
    model: UserModel,
    filter: { email }
  });

  if (existingUser) {
    return next(new Error("Email already exists", { cause: 409 }));
  }

  

  const user = await dbService.create({
    model: UserModel,
    data: { userName, email, password }
  });

  emailEvent.emit("sendEmail", { email });

  return successResponse({
    res,
    status: 201,
    message: "Account Created",
    data: { userId: user._id, email: user.email }
  });
});

export const confirmEmail = asyncHandller(async (req, res, next) => {
  const { email, code } = req.body;

  if (!email) {
    return next(new Error("Email is required.", { cause: 400 }));
  }

  const user = await dbService.findOne({ model: UserModel, filter: { email } });

  if (!user) {
    return next(new Error("User not found.", { cause: 404 }));
  }

  if (user.confirmEmail) {
    return next(new Error("Email is already verified.", { cause: 400 }));
  }

  const now = new Date();
  const OTP_EXPIRY_MS = 2 * 60 * 1000;       // 2 minutes
  const OTP_RESEND_COOLDOWN_MS = 2 * 60 * 1000;
  const OTP_MAX_TRIES = 5;
  const BLOCK_DURATION_MS = 60 * 60 * 1000;  // 1 hour

  // Blocked check
  if (user.confirmEmailOTPBlockedUntil && user.confirmEmailOTPBlockedUntil > now) {
    const waitMinutes = Math.ceil((user.confirmEmailOTPBlockedUntil - now) / 60000);
    return next(new Error(`Too many attempts. Try again in ${waitMinutes} minutes.`, { cause: 429 }));
  }

  // No code? Send OTP
  if (!code) {
    if (user.lastOTPRequestAt && now - user.lastOTPRequestAt < OTP_RESEND_COOLDOWN_MS) {
      const secondsLeft = Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - user.lastOTPRequestAt)) / 1000);
      return next(new Error(`Please wait ${secondsLeft} seconds before requesting another OTP.`, { cause: 429 }));
    }

    await sendNewOTP(user);  // Your helper to generate/send OTP and update timestamps
    return successResponse({ res, message: "OTP sent successfully." });
  }

  // Validate OTP
  if (!user.confirmEmailOTPCreatedAt || now - user.confirmEmailOTPCreatedAt > OTP_EXPIRY_MS) {
    return next(new Error("OTP expired. Please request a new code.", { cause: 400 }));
  }

  const isMatch = await compareHash({ plainText: code, hashValue: user.confirmEmailOTP });

  if (!isMatch) {
    user.confirmEmailOTPTries += 1;

    if (user.confirmEmailOTPTries >= OTP_MAX_TRIES) {
      user.confirmEmailOTPBlockedUntil = new Date(now.getTime() + BLOCK_DURATION_MS);
      await user.save();
      return next(new Error("Too many incorrect attempts. You are blocked for 1 hour.", { cause: 429 }));
    }

    await user.save();
    return next(new Error(`Invalid code. Attempt ${user.confirmEmailOTPTries}/${OTP_MAX_TRIES}`, { cause: 400 }));
  }

  // Valid OTP
  user.confirmEmail = true;
  user.confirmEmailOTP = undefined;
  user.confirmEmailOTPCreatedAt = undefined;
  user.confirmEmailOTPTries = 0;
  user.confirmEmailOTPBlockedUntil = undefined;
  user.lastOTPRequestAt = undefined;

  await user.save();

  return successResponse({ res, message: "Email confirmed successfully." });
});

export const resendOTP = asyncHandller(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new Error("Email is required.", { cause: 400 }));
  }

  const user = await dbService.findOne({
    model: UserModel,
    filter: { email }
  });

  if (!user) {
    return next(new Error("User not found.", { cause: 404 }));
  }

  if (user.confirmEmail) {
    return next(new Error("Email is already verified.", { cause: 400 }));
  }

  const now = new Date();
  const OTP_RESEND_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

  // Blocked check
  if (user.confirmEmailOTPBlockedUntil && user.confirmEmailOTPBlockedUntil > now) {
    const waitMinutes = Math.ceil((user.confirmEmailOTPBlockedUntil - now) / 60000);
    return next(new Error(`You are blocked. Try again in ${waitMinutes} minutes.`, { cause: 429 }));
  }

  // Cooldown check
  if (user.lastOTPRequestAt && now - user.lastOTPRequestAt < OTP_RESEND_COOLDOWN_MS) {
    const secondsLeft = Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - user.lastOTPRequestAt)) / 1000);
    return next(new Error(`Please wait ${secondsLeft} seconds before requesting another OTP.`, { cause: 429 }));
  }

  // Generate and send new OTP
  await sendNewOTP(user);  // This should handle updating user.lastOTPRequestAt and saving

  return successResponse({ res, message: "OTP sent successfully." });
});