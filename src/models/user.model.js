import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt';
const userSchema = new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim: true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim: true,
        },
        fullname:{
            type:String,
            required:true,
            lowercase:true,
            trim: true,  //removes only leading ans trailing spaces
        },
        avatar:{ 
            type:String,  //Cloudinary ka url
            required: true
        },
        coverImage:{
            type:String,
        },
        watchHistory:[  //watchHistory is an array of videos
            {
                type: Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:['true','Password is required']
        },
        refreshToken:{
            type:String
        }
    },
    {
        timestamps: true
    }
)

//before saving the above data into database, encrypt the password if it is modified (pre is used to do something before something else is done)
userSchema.pre("save", async function (next){
    if(this.isModified("password")){
        this.password = bcrypt.hash(this.password, 10);
    }
    next()
})


//checking the entered password is correct or not by decrypting the encrypted password (returns true or false)
userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password);
}

//method to generate access token using jwt
userSchema.methods.generateAccessToken = function (){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
             expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

//generate refresh token using jwt

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
             expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema);

