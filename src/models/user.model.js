import mongoose, {Schema}from "mongoose";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
const userSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,// cloudinary url
        required:true,
    },
    coverimage:{
        type:String,
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"video"
        }
    ],
    password:{
        type:String,
        required:[true,'Password is required']
    },
    refreshToken:{
        type:String,
    }
},{timestamps:true})

// hooks
userSchema.pre("Save",async function(next){
    if(!this.isModified("password")) return  next();
    this.password=bcrypt.hash(this.password,10)
    next();
})

// method to check wether a pwd given by user is correct or not
// custom method
userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}

// generate access token
userSchema.methods.generateAccessToken=function(){
     return jwt.sign(
        {
            // payload
            _id:this._id,
            email:this.email,
            userName:this.username,
            fullName:this.fullname,
        },
        // access token
        process.env.ACCESS_TOKEN_SECRET,
        // object
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
     )
}

// generate refresh token
userSchema.methods.generateRefreshToken=function(){
     return jwt.sign(
        {
            // payload
            _id:this._id,
        },
        // access token
        process.env.REFRESH_TOKEN_SECRET,
        // object
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
     )
}


export const User=mongoose.model("User",userSchema)