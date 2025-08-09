import Joi  from "joi";
import { genralFields, singleFileSchema } from "../../middleware/validation.middleware.js";


export const createPost = Joi.object({
  content: Joi.string().min(2).max(50000).messages({
    "string.min": "Content must be at least 2 characters",
    "string.max": "Content must be at most 50000 characters",
  }),

  file: Joi.array()
    .items(genralFields.file)
    .max(5) // optional: limit number of files
    .messages({
      "array.base": "File(s) must be an array",
      "array.max": "Maximum 5 files allowed per post",
    }),
}).or("content","file");
export const updatePost = Joi.object({
  postId: Joi.string().hex().length(24).required(),
  content: Joi.string().min(2).max(50000),
  file: genralFields.file.optional(),
}).or("content", "file");
export const deletePost = Joi.object({
  postId: Joi.string().hex().length(24).required(),
});
export const postIdParam = deletePost
export const toggleLikePostValidation = Joi.object({
  postId: Joi.string().hex().length(24).required(),
  action: Joi.string().valid("like", "unlike").required(),
});