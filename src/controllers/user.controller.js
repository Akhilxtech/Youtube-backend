import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apierrors.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiresponse.js"


const registerUser=asyncHandler(async (req,res)=>{
    // s-1 get user details from frontend
    // s-2 validation-not empty
    // s-3 check if user already exists:username and emaail
    // s-4 upload for images ,check for avatar
    // s-5 upload them to cloudinary,check avatar in cloudinary
    // s-6 create user object - create entry in db
    // s-7 remove password and refresh token field from response
    // s-8 check for user creation 
    // s-9 if created return response else return error

    // s-1

    const {fullname,email,username,password}=req.body
    console.log(` email: ${email}\n fullname: ${fullname}\n username:${username}\n password:${password}`);

    // s-2

    // if(fullname===""){ method 1
    //     throw new ApiError(400,"fullname is required")
    // }

    // advance method

    if(
        [fullname,email,password,username].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"all fields are required")
    }

    // s-3 
    const existedUser=User.findOne({
        $or:[{ username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username is already exists")
    }

    // s-4
    const avatarLocalPath=req.files?.avatar[0]?.path
    const coverImageLocalPath=req.files?.coverimage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required");
    }

    // s-5 
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"avatar is required")
    }
    // s-6

    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url||"" ,// agar cover image hai toh daldo nahi hai to empty rhne do
        email,
        password,
        username

    })

    // s-7
    const createdUser=await User.findById(user._id).select(
        // yha vo likho jo tumko nhi chiye
        "-password -refreshToken"
    )

    // s-8
    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering the user")
    }
    
    // s-9
    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully")
    )

})

export {registerUser}