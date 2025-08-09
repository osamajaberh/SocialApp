
import mongoose, { Types } from "mongoose";
import { Schema } from "mongoose";


const postSchema = new Schema({
  content: {
    type: String,
    minLength: 2,
    maxLength: 50000,
    required: function () {
      return this.attachments?.length ? false : true;
    },
  },
  attachments: [{ secure_url: String, public_id: String }],
  createdBy: { type: Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Types.ObjectId, ref: "User" },
  deletedBy: { type: Types.ObjectId, ref: "User" },
  likes: [{ type: Types.ObjectId, ref: "User" }],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// 👉 Add virtual populate here
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'postId',
});

postSchema.set('toObject', { virtuals: true });
postSchema.set('toJSON', { virtuals: true });

export const PostModel = mongoose.models.Post || mongoose.model("Post", postSchema);
