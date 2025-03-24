import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';

//method to generate access and refresh token 
const generateAccessAndRefreshTokens = async (userId)=>{
    try {
        const user = await User.findById(userId);
        const acceessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        //add refresh token into user database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave : false});

        return {acceessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500,"something went wrong while refresh and access token.")
    }
}



//method to register user
const registerUser = asyncHandler(async (req,res)=>{
    //get user details from frontend using req.body but it cannot get files so we use multer
    const {username, email, fullname ,password} = req.body;
    console.log(req.body);
    console.log("Files received:", req.files);
    
    if(fullname === "" || email ==="" || username==="" || password ===""){  //check if any field is empty
        throw new ApiError(400,"All fields are rerquired");
    }

    //check if the user is already registered using email and username

    const existedUser =await User.findOne({
        $or: [ {username} , {email} ]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists.")
    }

    //check if files are uploaded or not
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar required");
    }
    console.log(avatarLocalPath);
    // upload both coverimage and avatar to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("Cloudinary Avatar Response:", avatar);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    //check avatar again
    if(!avatar){
        throw new ApiError(400, "Avatar is required");
    }
    
    //upload the data to database
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })
    
    //check if user is successfully created and remove password and refreshToken
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering user");
    }

    //if user is registered return the user
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )

})

//method to login user
const loginUser = asyncHandler(async (req,res)=>{
    
    // if user is not found or password is incorrect return error

    // get details from frontend (email and password) from req->body
    const {email,username,password} = req.body;
    if(!username && !email){
        throw new ApiError(400,"Email or username required");
    }

    // check if user exists with the email
    const user = await User.findOne({
        $or: [{email},{username}]
    })

    // if user not found throw error
    if(!user) {
        throw new ApiError(404,"User not found")
    }
    
    // check if password is correct
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    // generate token and return it using cookies
    const {acceessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    

    //We are updating user because the last time we declared user it didn't have the refresh token field but now it has to get that we need to do it.
    const loggedInUser =await User.findById(user._id).select("-password -refreshToken")

    //send refresh token using cookies

    const options = {
        httpOnly : true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",acceessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, acceessToken, refreshToken
            },
            "user logged in successfully"
        )
    )
})

//method to logout user
const logoutUser = asyncHandler(async (req,res)=>{
    await User.findOneAndUpdate(req.user._id,{
        $set:{
            refreshToken:undefined
        }
    },{
        new: true
    })

    const options = {
        httpOnly : true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("acceessToke",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {} ,"User logged out"))
})

//to renew access token using refresh token
const renewAccessToken = asyncHandler(async (req,res)=>{

    //take the refresh token from the user
    const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken;

    // if token is absent return an error.
    if(!incomingRefreshToken){
        throw new ApiError(401," Unauthorised request ")
    }

    //decode the token using jwt
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        //get the user using id form the refresh token
        const user = await User.findById(decodedToken?._id)
    
        //if user not found throw error
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        //match the incoming refresh token with that of the saved refresh token of the user.
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        //if matches then generate new access and refresh token 
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {newAcceessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", newAcceessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {newAcceessToken, newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token") 
    }

})

//change current password of user
const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword , newPassword} = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect =  user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res.status(200).json(
        new ApiResponse(200,{},"Response changed successfully")
    )
})

//get the current user
const getCurrentUser = asyncHandler(async (req,res)=>{
    return res.status(200)
    .json(
        new ApiResponse(200, req.user , "Current user fetched successfully")
    )
}) 

//change fields like name (Update account)
const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname} = req.body
    if(!fullname){
        throw new ApiError(400,"All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
            }
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))

})


//updating avatar (files)
const updateUserAvatar = asyncHandler ( async (req,res)=>{
   const avatarLocalPath = req.file?.path
   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);

   if(!avatar.url){
    throw new ApiError(400,"Error while uploading avatar on cloudinary")
   }

   const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            avatar : avatar.url
        }
    },
    {new:true}
   ).select("-password")

   return res.status(200)
   .json(
    new ApiResponse(200, user, "Avatar updated successfully")
   )
})

//update coverImage 
const updateUsercoverImage = asyncHandler ( async (req,res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
     throw new ApiError(400,"coverImage file is missing")
    }
 
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
 
    if(!coverImage.url){
     throw new ApiError(400,"Error while uploading coverImage on cloudinary")
    }
 
    const user = await User.findByIdAndUpdate(
     req.user?._id,
     {
         $set:{
             coverImage : coverImage.url
         }
     },
     {new:true}
    ).select("-password")

    return res.status(200)
   .json(
    new ApiResponse(200, user, "Cover Image updated successfully")
   )
 
 })
export {registerUser,
    loginUser,
    logoutUser,
    renewAccessToken,
    updateUserAvatar,
    updateAccountDetails,
    getCurrentUser,
    changeCurrentPassword,
    updateUsercoverImage

};