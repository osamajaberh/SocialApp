import { Router } from "express";
import { validation } from "../../middleware/validation.middleware.js";
import { authentication, authorization } from "../../middleware/auth.middleware.js";
import * as postServices from "./service/post.service.js";
import * as postValidation from "./post.validation.js";
import { endpoint } from "./post.authorization.js";
import { cloudinaryUpload } from "../../utils/multer/cloud.multer.js";
import commentController from "../comment/comment.controller.js";

const postController = Router();
postController.use("/:postId/comment",commentController)

// Route: Create Post (with optional file upload)
postController.post(
  "/create",
  authentication(),  // Verify user is logged in
  authorization(endpoint.createPost),  // Verify permissions
  cloudinaryUpload("post",["image", "video", "pdf"]).array("file", 2),  // Upload max 2 files
  validation(postValidation.createPost),  // Validate content + files
  postServices.createPost  // Handle logic
);
postController.patch(
  "/update/:postId",
  authentication(),  // check logged in
  cloudinaryUpload("post", ["image", "video", "pdf"]).array("file", 5),  // upload files
  validation(postValidation.updatePost),  // validate content + file
  postServices.updatePost  // controller logic
);
postController.patch(
  "/delete/:postId",
  authentication(),
  validation(postValidation.deletePost), // validate postId if needed
  postServices.deletePost // use the updated controller
);
postController.patch(
  "/restore/:postId",
  authentication(),
  validation(postValidation.deletePost),
  postServices.restorePost
);
postController.patch(
  "/like/:postId",
  authentication(),
  validation(postValidation.toggleLikePostValidation),  // Validate postId + query
  postServices.toggleLikePost
);
postController.get(
  "/all",              // GET /post/all
  postServices.getAllPosts  // Controller to fetch all posts
);

export default postController