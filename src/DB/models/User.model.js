import mongoose from "mongoose";
import { Schema } from "mongoose";
import { genderTypes, roleTypes } from "../../constants/constants.js";
import { generateHash } from "../../utils/security/hash.security.js";

const userSchema = new Schema({
    userName:{
        type:String,
        required:true,
        trim:true,
        maxlength:30,
        minLength:2
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    confirmEmailOTP:String,
    password:{type:String,required:true},
    phone: String,
    DOB:Date,
    Image:String,
    coverImages:[String],
    gender:{
        type:String,
        enum:Object.values(genderTypes),
        default:genderTypes.male
    },
    role:{
        type:String,
        default:roleTypes.user
    },confirmEmail:{type:Boolean,default:false},
    isDeleted:{type:Boolean,default:false},
    changeCredentialsTime:Date,
confirmEmailOTPTries: { type: Number, default: 0 },
confirmEmailOTPCreatedAt: Date,
confirmEmailOTPBlockedUntil: Date,
lastOTPRequestAt: Date,
canResetPassword: { type: Boolean, default: false },
resetPasswordExpiresAt: Date,


},{timestamps:true})

userSchema.pre("save",async function (next) {
     if (this.isModified("password")) {
    this.password = await generateHash({plainText:this.password});  // your custom function
  }

  
  next();
    
})

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);