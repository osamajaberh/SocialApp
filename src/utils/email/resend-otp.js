import { customAlphabet } from "nanoid";
import { generateHash } from "../security/hash.security.js";
import { sendEmail } from "../email/send.email.js";
import { verifyAccountTemplate } from "../email/template/verify.account.template.js";

/**
 * Generates a 4-digit OTP, hashes it, saves it to the user, and sends an email.
 * @param {Object} user - Mongoose user document
 */
export const sendNewOTP = async (user) => {
    const otp = customAlphabet("0123456789", 4)();
    const hashOTP = generateHash({ plainText: otp });
    const now = new Date();

    // Update user fields
    user.confirmEmailOTP = hashOTP;
    user.confirmEmailOTPCreatedAt = now;
    user.confirmEmailOTPTries = 0;
    user.confirmEmailOTPBlockedUntil = undefined;
    user.lastOTPRequestAt = now;

    await user.save();

    // Send the OTP email
    await sendEmail({
        to: user.email,
        subject: "Confirm Email",
        html: verifyAccountTemplate({ code: otp })
    });
};
