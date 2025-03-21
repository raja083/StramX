import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
//method to register user
const registerUser = asyncHandler(async (req,res)=>{
    //get user details from frontend using req.body but it cannot get files so we use multer
    const {username, email, fullname } = req.body;
    
    if(fullname === "" || email ==="" || username==="" || password ===""){  //check if any field is empty
        throw new ApiError(400,"All fields are rerquired");
    }

    //check if the user is already registered using email and username

    const existedUser = User.findOne({
        $or: [ {username} , {email} ]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists.")
    }

    //check if files are uploaded or not
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar required");
    }

    // upload both coverimage and avatar to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
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

export {registerUser};