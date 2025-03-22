import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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

export {registerUser,
    loginUser,
    logoutUser
};