
import { UserModel } from "../../../DB/models/User.model.js";
import { asyncHandller } from "../../../utils/response/error.response.js";
import { successResponse } from "../../../utils/response/success.response.js";
import * as dbService from "../../../DB/db.service.js"
import { compareHash, generateHash } from "../../../utils/security/hash.security.js";
import cloudinary from "../../../utils/multer/cloudinary.multer.js";

export const getUserProfile = asyncHandller(async (req, res, next) => {
  const userId = req.loggedInUser._id;

  const user = await dbService.findById({
    model: UserModel,
    id: userId,
    select: "-password -confirmEmailOTP -confirmEmailOTPCreatedAt -confirmEmailOTPTries -confirmEmailOTPBlockedUntil -__v",
  });

  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "User profile fetched successfully",
    data: { user },
  });
});
export const UpdatePassword = asyncHandller(async(req,res,next)=>{
const {currentPassword,newPassword,confirmPassword} = req.body
if(!currentPassword||!newPassword||!confirmPassword){
   return next(new Error("All fiels are required",{cause:400}))

}
if(newPassword!==confirmPassword){
  return next(new Error("New password and confirm password must be matched"))

}
const userId = req.loggedInUser._id;
const user = await dbService.findById({model:UserModel,id:userId,select:"+password"})
if(!user){
  return next(new Error("User not found", { cause: 404 }));
}
const isMatch = await compareHash({plainText:currentPassword,hashValue:user.password})
if(!isMatch){
  return next (new Error("IncrorrectPasswrod",{cause:401}))
}

  user.password = newPassword
   user.changeCredentialsTime = new Date(); // Invalidate old tokens
  await user.save();

  return successResponse({ res, message: "Password updated successfully" });
})
export const updateUserProfile = asyncHandller(async (req, res, next) => {
  const userId = req.loggedInUser._id;
  const updateData = req.body;

  const updatedUser = await dbService.findByIdAndUpdate({
    model: UserModel,
    id: userId,
    data: updateData,
    options: { new: true }, // return updated doc
    select: "-password", // exclude password
  });

  if (!updatedUser) {
    return next(new Error("User not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});
function extractPublicId(imageUrl) {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);
    const parts = url.pathname.split("/"); 
    const filenameWithExt = parts.pop(); // abc123.jpg
    const publicId = filenameWithExt.split(".")[0]; // abc123

    const versionIndex = parts.findIndex(part => part.startsWith("v")); 
    const folderPathParts = parts.slice(versionIndex + 1); // e.g., [socialApp, user, userID, profile]

    const fullPublicId = [...folderPathParts, publicId].join("/"); 
    return fullPublicId; // e.g., socialApp/user/userID/profile/abc123
  } catch (err) {
    console.error("Invalid image URL format:", imageUrl);
    return null;
  }
}
export const updateProfileImage = asyncHandller(async (req, res, next) => {
  const userId = req.loggedInUser._id;

  if (!req.file?.path || !req.file?.filename) {
    return next(new Error("No image uploaded", { cause: 400 }));
  }

  const newImageURL = req.file.path;

  const user = await dbService.findById({
    model: UserModel,
    id: userId,
  });

  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  // Delete old Cloudinary image if exists
  const oldPublicId = extractPublicId(user.Image);
  if (oldPublicId) {
    await cloudinary.uploader.destroy(oldPublicId);
  }

  // Update image in DB
  const updatedUser = await dbService.findByIdAndUpdate({
    model: UserModel,
    id: userId,
    data: { Image: newImageURL },
    options: { new: true },
    select: "-password",
  });

  return successResponse({
    res,
    message: "Profile image updated successfully",
    data: { image: updatedUser.Image },
  });
});

export const updateCoverImages = asyncHandller(async (req, res, next) => {
  const userId = req.loggedInUser._id;

  // Collect file paths
  const coverPaths = req.files.map(file => file.finalPath);

  // Update DB with coverImages array
  const user = await dbService.findByIdAndUpdate({
    model: UserModel,
    id: userId,
    data: { coverImages: coverPaths },
    options: { new: true, select: "-password" },
  });

  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Cover images updated successfully",
    data: user,
  });
});
