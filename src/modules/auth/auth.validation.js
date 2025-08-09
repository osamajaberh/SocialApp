import Joi from "joi";
import { genralFields } from "../../middleware/validation.middleware.js";

// ✅ Signup
export const signup = Joi.object({
  userName: genralFields.userName.required(),
  email: genralFields.email.required(),
  password: genralFields.password.required(),
  confirmationPassword: genralFields.confirmationPassword
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
      "string.empty": "Confirmation password is required",
    }),
}).required();

// ✅ Confirm Email
export const confirmEmail = Joi.object({
  email: genralFields.email.required(),
  code: genralFields.code.required(),
});

// ✅ Login
export const login = Joi.object({
  email: genralFields.email.required(),
  password: genralFields.password.required(),
}).required();

// ✅ Email only (for forgot password, resend OTP, etc.)
export const emailOnly = Joi.object({
  email: genralFields.email.required(),
});

// ✅ Update Password (note: currentPassword can be less strict if desired)
export const updatePassword = Joi.object({
  currentPassword: genralFields.password.required(), // or genralFields.currentPassword if you split it
  newPassword: genralFields.password.required(),
  confirmPassword: Joi.any()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "New password and confirm password do not match",
      "string.empty": "Confirmation password is required",
    }),
});

// ✅ Update Profile (optional fields only)
export const updateProfile = Joi.object({
  userName: genralFields.userName,
  DOB: genralFields.DOB,
  gender: genralFields.gender,
  phone: genralFields.phone,
});
export const ProfileImage = Joi.object({
  file: Joi.object({
    originalname: Joi.string().required(),
    mimetype: Joi.string()
      .valid("image/jpeg", "image/png", "image/jpg")
      .required()
      .messages({
        "any.only": "Only JPEG, PNG, or JPG images are allowed",
      }),
    size: Joi.number()
      .max(2 * 1024 * 1024) // 2 MB
      .messages({
        "number.max": "Image size must not exceed 2MB"}),
  })
    .required()
    .unknown(true) // ⬅️ Allow multer extra fields like 'path', 'filename', etc.
    .messages({
      "any.required": "Image file is required",
    }),
});