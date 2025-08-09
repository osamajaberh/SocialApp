

import { authentication, authorization } from "../../middleware/auth.middleware.js";
import { endpoint } from "./comment.authorization.js";
import * as commentService from "./service/comment.service.js"
import { Router } from "express"
import * as Commentvalidators from "./comment.validation.js"
import { cloudinaryUpload } from "../../utils/multer/cloud.multer.js";
import { validation } from "../../middleware/validation.middleware.js";

const commentController = Router({
    mergeParams:true
}
);


commentController.post(
  "/",
  authentication(),
  authorization(endpoint.create),
  cloudinaryUpload("comment", ["image", "video", "pdf"]).array("file", 2), // Upload up to 5 files
  validation(Commentvalidators.createComment), // Validate content, postId, files
  commentService.createComment
);
commentController.patch(
  "/:commentId",
  authentication(),
  authorization(endpoint.update),
  cloudinaryUpload("comment", ["image", "video", "pdf"]).array("file", 5), // Upload up to 5 files
  validation(Commentvalidators.updateComment), // Validate content, postId, files
  commentService.updateComment
);
commentController.patch(
  "/delete/:commentId",
  authentication(),
  validation(Commentvalidators.deleteComment),
  commentService.deleteComment
);
commentController.patch(
  "/restore/:commentId",
  authentication(),
  validation(Commentvalidators.restoreComment),
  commentService.restoreComment
);
commentController.patch(
  "/:commentId/like",
  authentication(),
  validation(Commentvalidators.likeCommentValidation),
  commentService.toggleLikeComment
);
commentController.post(
  "/:commentId/reply",
  authentication(),
  authorization(endpoint.create), // Same permission as creating comment
  cloudinaryUpload("comment", ["image", "video", "pdf"]).array("file", 2), // Optional files for reply
  validation(Commentvalidators.createReply), // Optional: separate validator
  commentService.replyToComment // New controller function
);



export default commentController