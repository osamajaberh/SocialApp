import Joi from "joi";
import { genralFields } from "../../middleware/validation.middleware.js";

export const createComment = Joi.object({
    postId: Joi.string().hex().length(24).required(),
  content: Joi.string().min(2).max(50000),
  file: genralFields.file.optional(),
}).or("content", "file");

export const updateComment = Joi.object({
  postId: Joi.string().hex().length(24).required(),
  commentId: Joi.string().hex().length(24).required(),
  content: Joi.string().min(2).max(50000),
  file: genralFields.file.optional(),
}).or("content", "file");  // at least one must be provided
export const deleteComment = Joi.object({
  postId: Joi.string().hex().length(24).required(),
  commentId: Joi.string().hex().length(24).required(),
  
}); // at least one must be provided

export const restoreComment = deleteComment
export const likeCommentValidation = Joi.object({
   postId: Joi.string().hex().length(24).required(),
  commentId: Joi.string().hex().length(24).required(),
  action: Joi.string().valid("like", "unlike").required()
});
export const createReply = updateComment;