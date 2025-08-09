import { asyncHandller } from "../../../utils/response/error.response.js";
import * as dbService from "../../../DB/db.service.js";
import { successResponse } from "../../../utils/response/success.response.js";
import { CommentModel } from "../../../DB/models/comment.model.js";
import { PostModel } from "../../../DB/models/post.model.js";

export const createComment = asyncHandller(async (req, res, next) => {
  const { postId } = req.params; // ✅ get postId, not commentId
  const userId = req.loggedInUser._id;
  const { content } = req.body;

  // ✅ Check if post exists and is not deleted
  const post = await dbService.findById({
    model: PostModel,
    id: postId,
  });

  if (!post || post.isDeleted) {
    return next(new Error("Post not found or deleted", { cause: 404 }));
  }

  const commentData = {
    content,
    postId,
    createdBy: userId,
  };

  // ✅ Handle attachments (optional)
  if (req.files?.length) {
    const attachments = req.files.map((file) => ({
      secure_url: file.path,
      public_id: file.filename.split(".")[0],
    }));
    commentData.attachments = attachments;
  }

  // ✅ Create the comment
  const newComment = await dbService.create({
    model: CommentModel,
    data: commentData,
  });

  return successResponse({
    res,
    status: 201,
    message: "Comment created successfully",
    data: newComment,
  });
})
export const updateComment = asyncHandller(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.loggedInUser._id;
  const comment = await dbService.findById({
    model: CommentModel,
    id: commentId,
  });
  if (!comment || comment.isDeleted) {
    return next(new Error("Comment not found or deleted", { cause: 404 }));
  }
  // only owner can update his comment

  const isOwner = comment.createdBy.toString() === userId.toString();
  if (!isOwner) {
    return next(
      new Error("Unathorized to update this comment", { cause: 403 })
    );
  }
  const updateData = { updatedby: userId };
  if (req.body.content) updateData.content = req.body.content;
  if (req.files?.length) {
    const newAttachments = req.files.map((file) => ({
      secure_url: file.path,
      public_id: filename.split(".")[0],
    }));
    updateData.attachments = [...comment.attachments, ...newAttachments];
  }
  const updatedComment = await dbService.findByIdAndUpdate({
    model: CommentModel,
    id: commentId,
    data: updateData,
    options: { new: true },
  });
  return successResponse({
    res,
    status: 201,
    message: "comment updated successfully",
    data: updatedComment,
  });
});
export const deleteComment = asyncHandller(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.loggedInUser._id;
  const userRole = req.loggedInUser.role;
  const comment = await dbService.findById({
    model: CommentModel,
    id: commentId,
  });
  if (!comment || comment.isDeleted) {
    return next(new Error("comment not found or deleted", { cause: 404 }));
  }

  if (!comment) {
    return next(new Error("Associated comment not found", { cause: 404 }));
  }

  const isCommentOwner = comment.createdBy.toString() === userId.toString();
  const iscommentOwner = comment.createdBy.toString() === userId.toString();
  const isAdmin = userRole === "admin";

  if (!isCommentOwner && !iscommentOwner && !isAdmin) {
    return next(
      new Error("You are not authorized to delete this comment", { cause: 403 })
    );
  }
  comment.isDeleted = true;
  comment.deletedBy = userId;
  await comment.save();

  return successResponse({
    res,
    message: "Comment deleted successfully",
    data: { commentId, deleted: true },
  });
});
export const restoreComment = asyncHandller(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.loggedInUser._id;
  const comment = await dbService.findById({
    model: CommentModel,
    id: commentId,
  });
  if (!comment || !comment.isDeleted) {
    return next(new Error("Comment not found or not deleted", { cause: 404 }));
  }
  if (comment.deletedBy?.toString() !== userId.toString()) {
    return next(
      new Error("You are not authorized to restore this comment", {
        cause: 403,
      })
    );
  }
  comment.isDeleted = false;
  comment.deletedBy = undefined;

  comment.save();
  return successResponse({
    res,
    message: "Comment restored Successfully",
    data: { commentId, restored: true },
  });
});
export const toggleLikeComment = asyncHandller(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.loggedInUser._id;
  const action = req.query.action;

  if (!["like", "unlike"].includes(action)) {
    return next(new Error("Invalid action. Must be 'like' or 'unlike'", { cause: 400 }));
  }

  const comment = await dbService.findById({ model: CommentModel, id: commentId });
  if (!comment || comment.isDeleted) {
    return next(new Error("Comment not found or deleted", { cause: 404 }));
  }

  const updateQuery =
    action === "unlike"
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

  const updatedComment = await dbService.findByIdAndUpdate({
    model: CommentModel,
    id: commentId,
    data: updateQuery,
    options: { new: true },
  });

  return successResponse({
    res,
    message: `Comment ${action}d successfully`,
    data: { commentId, totalLikes: updatedComment.likes.length },
  });
});
export const replyToComment = asyncHandller(async (req, res, next) => {
  const { commentId } = req.params; // Parent comment ID
  const userId = req.loggedInUser._id;
  const { content } = req.body;

  // Check parent comment exists
  const parentComment = await dbService.findById({
    model: CommentModel,
    id: commentId,
  });

  if (!parentComment || parentComment.isDeleted) {
    return next(new Error("Parent comment not found or deleted", { cause: 404 }));
  }

  const replyData = {
    content,
    postId: parentComment.postId, // Same post as parent
    parentCommentId: commentId,   // Link reply to parent
    createdBy: userId,
  };

  // Handle attachments
  if (req.files?.length) {
    const attachments = req.files.map((file) => ({
      secure_url: file.path,
      public_id: file.filename.split(".")[0],
    }));
    replyData.attachments = attachments;
  }

  const newReply = await dbService.create({
    model: CommentModel,
    data: replyData,
  });

  return successResponse({
    res,
    status: 201,
    message: "Reply created successfully",
    data: newReply,
  });
});

