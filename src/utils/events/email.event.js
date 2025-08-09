import { customAlphabet } from "nanoid";
import { EventEmitter } from "node:events";
import { generateHash } from "../security/hash.security.js";
import { UserModel } from "../../DB/models/User.model.js";
import { sendEmail } from "../email/send.email.js";
import { verifyAccountTemplate } from "../email/template/verify.account.template.js";

export const emailSubject = {
    confirmEmail: "Confirm Email",
    resetPassword: "Reset Password"
};

export const emailEvent = new EventEmitter();

export const sendCode = async ({ email, subject = emailSubject.confirmEmail }) => {
    const user = await UserModel.findOne({ email });

    if (!user) {
        console.log("User not found. Cannot send OTP.");
        return;
    }

    const now = new Date();

    if (user.lastOTPRequestAt && (now - user.lastOTPRequestAt < 2 * 60 * 1000)) {
        const secondsLeft = Math.ceil((2 * 60 * 1000 - (now - user.lastOTPRequestAt)) / 1000);
        console.log(`Cooldown active. Wait ${secondsLeft}s before resending OTP.`);
        return;
    }

    const otp = customAlphabet("0123456789", 4)();
    const hashOTP = generateHash({ plainText: otp });

    user.confirmEmailOTP = hashOTP;
    user.confirmEmailOTPCreatedAt = now;
    user.confirmEmailOTPTries = 0;
    user.confirmEmailOTPBlockedUntil = undefined;
    user.lastOTPRequestAt = now;

    const html = verifyAccountTemplate({ code: otp });

    try {
        await sendEmail({ to: email, subject, html });
        await user.save();
        console.log("OTP sent successfully.");
    } catch (error) {
        console.error("Failed to send OTP:", error.message);
    }
};

emailEvent.on("sendEmail", async (data) => {
    await sendCode({ email: data.email, subject: emailSubject.confirmEmail });
});

emailEvent.on("forgotPassword", async (data) => {
    await sendCode({ email: data.email, subject: emailSubject.resetPassword });
});
