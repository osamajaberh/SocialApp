import { asyncHandller } from "../../../utils/response/error.response.js";
import  * as dbService from "../../../DB/db.service.js"
import { successResponse } from "../../../utils/response/success.response.js";
import { PostModel } from "../../../DB/models/post.model.js";
import { CommentModel } from "../../../DB/models/comment.model.js";
import { paginate } from "../../../utils/paginate.js";





export const createPost = asyncHandller(async (req, res, next) => {
  const userId = req.loggedInUser._id;

  const attachments = Array.isArray(req.files)
    ? req.files.map((file) => ({
        secure_url: file.path,
        public_id: file.filename || file.public_id, // adjust based on Cloudinary version
      }))
    : [];

  const { content } = req.body;

  // Validate: Either content or at least one attachment required (handled in schema too)
  if (!content && attachments.length === 0) {
    return next(new Error("Post must have content or at least one attachment", { cause: 400 }));
  }

  const newPost = await dbService.create({
    model: PostModel,
    data: {
      content,
      attachments,
      createdBy: userId,
    },
  });

  return successResponse({
    res,
    message: "Post created successfully",
    data: newPost,
  });
});
export const updatePost = asyncHandller(async (req, res, next) => {
  const { postId } = req.params;
  const userId = req.loggedInUser._id;

  // 1. Fetch post and check ownership
  const post = await dbService.findById({ model: PostModel, id: postId });
  if (!post || post.isDeleted) {
    return next(new Error("Post not found or deleted", { cause: 404 }));
  }

  if (post.createdBy.toString() !== userId.toString()) {
    return next(new Error("Unauthorized to update this post", { cause: 403 }));
  }

  // 2. Prepare updated data
  const updateData = { updatedBy: userId };
  const { content } = req.body;

  if (content) updateData.content = content;

  // 3. Handle new file uploads
  if (req.files?.length > 0) {
    const newAttachments = req.files.map(file => ({
      secure_url: file.path,
      public_id: file.filename.split(".")[0], 
    }));

   
    updateData.attachments = [...post.attachments, ...newAttachments];

  
  }

  
  const updatedPost = await dbService.findByIdAndUpdate({
    model: PostModel,
    id: postId,
    data: updateData,
    options: { new: true },
  });

  return successResponse({
    res,
    message: "Post updated successfully",
    data: updatedPost,
  });
})
export const deletePost = asyncHandller(async (req, res, next) => {
  const { postId } = req.params;
  const userId = req.loggedInUser._id;
  const userRole = req.loggedInUser.role;

  const post = await dbService.findById({ model: PostModel, id: postId });
  if (!post || post.isDeleted) {
    return next(new Error("Post not found or already deleted", { cause: 404 }));
  }

  // Only owner or admin can delete
  const isOwner = post.createdBy.toString() === userId.toString();
  const isAdmin = userRole === "admin";

  if (!isOwner && !isAdmin) {
    return next(new Error("Unauthorized to delete this post", { cause: 403 }));
  }

  // ✅ Soft delete and track who deleted it
  post.isDeleted = true;
  post.deletedBy = userId;

  await post.save();

  return successResponse({
    res,
    message: "Post has been deleted (soft delete)",
    data: { postId, deleted: true },
  });
});
export const restorePost = asyncHandller(async (req, res, next) => {
  const { postId } = req.params;
  const userId = req.loggedInUser._id;

  const post = await dbService.findById({ model: PostModel, id: postId });

  if (!post || !post.isDeleted) {
    return next(new Error("Post not found or not deleted", { cause: 404 }));
  }

  //  Only the user who deleted it can restore
  const deletedBy = post.deletedBy?.toString();
  if (deletedBy !== userId.toString()) {
    return next(new Error("You are not authorized to restore this post", { cause: 403 }));
  }

  post.isDeleted = false;
  post.deletedBy = null; // Clear deletedBy field
  await post.save();

  return successResponse({
    res,
    message: "Post has been restored successfully",
    data: { postId, restored: true },
  });
});
export const toggleLikePost = asyncHandller(async (req, res, next) => {
  const { postId } = req.params;
  const userId = req.loggedInUser._id;
  const action = req.query.action;

  if (!["like", "unlike"].includes(action)) {
    return next(new Error("Invalid action. Must be 'like' or 'unlike'", { cause: 400 }));
  }

  const post = await dbService.findById({ model: PostModel, id: postId });
  if (!post || post.isDeleted) {
    return next(new Error("Post not found or deleted", { cause: 404 }));
  }

  const updateQuery =
    action === "unlike"
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

  const updatedPost = await dbService.findByIdAndUpdate({
    model: PostModel,
    id: postId,
    data: updateQuery,
    options: { new: true },
  });

  return successResponse({
    res,
    message: `Post ${action}d successfully`,
    data: { postId, totalLikes: updatedPost.likes.length },
  });
});

export const getAllPosts = asyncHandller(async (req, res, next) => {
  const { data: posts, pagination } = await paginate({
    req,
    model: PostModel,
    filter: { isDeleted: false },
    populate: [
      { path: "createdBy", select: "userName email" },
      { path: "updatedBy", select: "userName email" },
      {
        path: "comments",
        match: { isDeleted: false },
        populate: [
          { path: "createdBy", select: "userName email" },
          {
            path: "replies",
            match: { isDeleted: false },
            populate: { path: "createdBy", select: "userName email" },
          },
        ],
      },
    ],
  });

  return successResponse({
    res,
    message: "Fetched posts with comments successfully",
    data: posts,
    pagination,
  });
});
