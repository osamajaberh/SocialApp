import Joi from "joi";
import { genderTypes } from "../constants/constants.js";

// ✅ Single file schema for both single and multiple file validation
export const singleFileSchema = Joi.object({
  fieldname: Joi.string().required(),
  originalname: Joi.string().required(),
  encoding: Joi.string(),
  mimetype: Joi.string().required(),
  size: Joi.number(),
  path: Joi.string(),
  filename: Joi.string(),
}).required().messages({
  "object.base": "File must be a valid upload object",
});

// ✅ General validation fields reused across schemas
export const genralFields = {
  userName: Joi.string().min(3).max(20).trim().lowercase().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username must be at most 20 characters",
  }),

  email: Joi.string().email().required().messages({
    "string.email": "Invalid email format",
    "string.empty": "Email is required",
  }),

  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must contain uppercase, lowercase, number, min 6 characters",
    }),

  confirmationPassword: Joi.any()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
      "string.empty": "Confirmation password is required",
    }),

  code: Joi.string().pattern(/^\d{4}$/).required().messages({
    "string.pattern.base": "Code must be 4 digits",
    "string.empty": "Code is required",
  }),

  phone: Joi.string().pattern(/^01[0-2,5]{1}[0-9]{8}$/).messages({
    "string.pattern.base": "Phone must be a valid Egyptian mobile number",
  }),

  // ✅ Gender field (added back)
  gender: Joi.string()
    .valid(...Object.values(genderTypes))
    .messages({
      "any.only": `Gender must be one of: ${Object.values(genderTypes).join(", ")}`,
    }),

  // ✅ Date of birth field (added back)
  DOB: Joi.date().less("now").messages({
    "date.less": "Date of birth must be in the past",
    "date.base": "Invalid date format for DOB",
  }),

  // ✅ File validation (single or array)
  file: Joi.alternatives().try(
    singleFileSchema,
    Joi.array().items(singleFileSchema).min(1)
  ).messages({
    "alternatives.match": "File must be a valid upload or array of uploads",
  }),
};
export const validation = (Schema) => {
  return (req, res, next) => {
    const inputs = { ...req.query, ...req.body, ...req.params };

    if (req.file) {
      inputs.file = [req.file];  // Convert to array
    } else if (req.files?.length) {  //  Only if files exist
      inputs.file = req.files;
    }
    //  Do not add 'file' if nothing uploaded

    const validationResult = Schema.validate(inputs, { abortEarly: false });

    if (validationResult.error) {
      const errorDetails = validationResult.error.details.map(err => err.message);
      return res.status(400).json({
        message: "Validation error",
        errors: errorDetails,
      });
    }

    return next();
  };
};
