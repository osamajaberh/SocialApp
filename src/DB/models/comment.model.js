import mongoose, { Types } from "mongoose";
import { Schema } from "mongoose";

const commentSchema = new Schema({
  content: {
    type: String,
    minLength: 2,
    maxLength: 50000,
    required: function () {
      return this.attachments?.length ? false : true;
    },
  },
  attachments: [{ secure_url: String, public_id: String }],
  tags: [{ type: Types.ObjectId, ref: "User" }],
  postId: { type: Types.ObjectId, ref: "Post", required: true },
  parentCommentId: { type: Types.ObjectId, ref: "Comment", default: null }, // ✅ Added
  createdBy: { type: Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Types.ObjectId, ref: "User" },
  deletedBy: { type: Types.ObjectId, ref: "User" },
  likes: [{ type: Types.ObjectId, ref: "User" }],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentCommentId',
});

commentSchema.set('toObject', { virtuals: true });
commentSchema.set('toJSON', { virtuals: true });

export const CommentModel = mongoose.models.Comment || mongoose.model("Comment", commentSchema);
