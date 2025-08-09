import { Router } from "express";
import { authentication } from "../../middleware/auth.middleware.js";
import * as userServices from "../User/service/user.service.js"
import { validation } from "../../middleware/validation.middleware.js";
import *as validators from "../auth/auth.validation.js"
import { fileValidation, uploadFileDisck } from "../../utils/multer/local.multer.js";
import { cloudinaryUpload } from "../../utils/multer/cloud.multer.js";







const userController = Router();
userController.patch(
  "/upload-profile-image",
  authentication(),
  cloudinaryUpload("profile",["image"]).single("image"),
  userServices.updateProfileImage
);

userController.get("/profile",authentication(),userServices.getUserProfile)
userController.patch("/updatePassword",authentication(),validation(validators.updatePassword),userServices.UpdatePassword)
userController.patch("/updateProfile",authentication(),validation(validators.updateProfile),userServices.updateUserProfile)
/*userController.patch("/update-image",
    authentication()
,uploadFileDisck("user",fileValidation.image)
.single("file"),validation(validators.ProfileImage)
,userServices.updateProfileImage)*/
userController.patch("/update/image/cover",authentication(),uploadFileDisck("user",fileValidation.image)
.array("images",3),userServices.updateCoverImages)


export default userController;