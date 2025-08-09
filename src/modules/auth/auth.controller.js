import { Router } from "express";


import * as registrationService from "./service/registration.service.js"
import * as loginService from "./service/Login.service.js"

import *as validators from "./auth.validation.js"
import { validation } from "../../middleware/validation.middleware.js";



const authController = Router();

authController.post("/signup",validation(validators.signup),registrationService.signUp)
authController.patch("/confirm-email",validation(validators.confirmEmail),registrationService.confirmEmail)
authController.post("/login",loginService.login)
//authController.post("/loginWithGmail",loginService.loginWithGmail)
authController.post("/resend-otp", validation(validators.emailOnly), registrationService.resendOTP);
authController.get("/refresh-token",loginService.refreshToken)
authController.post("/forget-password",validation(validators.emailOnly),loginService.forgetPassword)
authController.patch("/forget-password/validate",validation(validators.emailOnly),loginService.validateForgetPassword)
authController.patch("/reset-password",validation(validators.login),loginService.resetPassword)


export default authController