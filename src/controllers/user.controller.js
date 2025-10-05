import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apierrors.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiresponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens=async (userId)=>{
    try {
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        // saving refresh token
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {refreshToken,accessToken}

    } catch (error) {
        throw new ApiError(500,"something went wrong while genrating refresh and access token")
    }
}


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
    const existedUser=await User.findOne({
        $or:[{ username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username is already exists")
    }


    // s-4
    const avatarLocalPath=req.files?.avatar[0]?.path
    // const coverImageLocalPath=req.files?.coverimage[0]?.path


    

    let coverImageLocalPath;
    if(req.files&&Array.isArray(req.files.coverimage)&&req.files.coverimage.length>0){
        coverImageLocalPath=req.files.coverimage[0].path
    }
    
    
 

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

const loginUser=asyncHandler(async (req,res)=>{
    // s-1 take data from req body
    // s-2 get data username or email
    // s-3 find user in db
    // s-4 check pwd
    // s-5 Access and refresh token and give to user
    // s-6 send these tokens in form of secure cookies
    // s-7 send response

    // s-1
    console.log("req.body:",req.body);


    const {username,email,password}=req.body

    
    

    // s-2
    if(!username&&!email){
        throw new ApiError(400,"username or email is required")
    }

    // s-3
    const user=await User.findOne({
        $or:[{email},{username}]
    })

    if(!user){
        throw new ApiError(404 ,"user does not exists")
    }
    // s-4
    const isPasswordValid=await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"password is incorrect")
    }

    // s-5
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
    
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
    // s-6

    const options={
        httpOnly:true,
        secure:true,
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,
                refreshToken
            },
            "user logged in Successfully"
        )
    )
})

const logoutUser=asyncHandler(async (req,res)=>{
    // s-2 clear cookies
    // s-1 remove refresh token from db

    // s-1
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    // s-2 
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,"user loggedout successfully"))

})

const refreshAccessToken=asyncHandler(async (req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
 try {
       
       // verify
       const decodedToken=jwt.verify(
           incomingRefreshToken,
           process.env.REFRESH_TOKEN_SECRET
       )
   
       const user=await User.findById(decodedToken?._id)
       console.log("decoded token:",decodedToken);
       
       if(!user){
           throw new ApiError(401,"invalid refresh token")
       }
   
       if(incomingRefreshToken!==user?.refreshToken){
           throw new ApiError(401,"Refresh token is epired or used")
       }
   
       const options={
           httpOnly:true,
           secure:true,
       }
   
       const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id);
   
       return res
       .status(200)
       .cookie("accessToken",accessToken,options)
       .cookie("newRefreshToken",newRefreshToken,options)
       .json(
           new ApiResponse(
               200,
               {accessToken,refreshToken:newRefreshToken},
               "Access Token refreshed"
           )
       )
 } catch (error) {
    throw new ApiError(401,error?.message||"invalid refresh token")
    
 }
})


const changeCurrentUserPassword=asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword}=req.body

    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"invalid old password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})// skip validation before saving

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password changed successfully")
    )


})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullname,email,}=req.body
    if(!fullname||!email ){
        throw new ApiError(400,"All fields are required");
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email:email// dono tariko se kar skte ho
            }
        },
        {new:true}// isko user karne update hone ke bad jo new info hoti hai vo return hoti hai

    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))

})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if(!avatar){
        throw new ApiError(400,"Error while uploading on avatar")
    }
    const oldAvatar=await User.findById(req.user?._id)
    const oldAvatarUrl=oldAvatar?.avatar

    if(oldAvatarUrl){
        const deleteAvatar=await deleteFromCloudinary(oldAvatarUrl);
        if(!deleteAvatar){
            throw new ApiError(400,"Error while deleteing Avatar")
        }
    }

   

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {$set:{
            avatar:avatar.url
        }},
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully"))
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"cover Image file is missing")
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage){
        throw new ApiError(400,"Error while uploading on coverimage")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {$set:{
            coverimage:coverImage.url
        }},
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"cover image updated successfully"))
})


const getUserChannelProfile=asyncHandler(async (req,res)=>{
    const {username}=req.prams

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel=await User.aggregate([
        // first pipeline
        {
            $match:{
                username:username?.toLowerCase()
            },
        },
        // 2nd pipeline
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        // 3rd pipeline
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        // 4th pipeline
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in:[req.user?._id,"$subscribers.subscriber" ]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        // final pipeline
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverimage:1,
                email:1,
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"user channel fetched successfully")
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentUserPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,getUserChannelProfile
}