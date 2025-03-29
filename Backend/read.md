# project : This is a project on backend

# code explaination : mongodb connection
1. Connecting the database in index.js
(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on("error",(error)=>{   **this is a listener used to handle if the express app is not able to interact with the database**
            console.log("ERR:",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.log("ERROR:",error);
        throw error
    }
})()

EXPLANATION : 
1. First of all this is an **IFFE** function (immediately executed).
2. The process of database connection can be problematic hence to handle the error while connecting it uses **TRY-CATCH** block.
3. The database is always situated in another continent( far-off). Hence the connection may take some time. So **async-await** is used.

2. Connecting the database in a separate file and importing it in index.js
//CODE:

connectDB() 
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERR:",error);
        throw error;
    })
    app.listen(process.env.PORT || 8000 ,()=>{
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGO db connection failed!!",err);
})

//This code imports the connectDB function from connection.js and runs it. Once the database is connected it will start the express server and throw the error if any.



# JWT : its working 
JWT is used to generate access token and refresh token . The work fow is :

-> User logs in.
-> Server generates:
    Access Token (short-lived)
    Refresh Token (long-lived)
->Client stores tokens:
    Access Token: in memory / localStorage / cookie
    Refresh Token: ideally in HTTP-only cookie (safer!)
->Client uses Access Token to make API calls.
->When Access Token expires:
    Client sends the Refresh Token to server (usually via a special endpoint like /token/refresh).
-> Server verifies the Refresh Token and    issues a new Access Token (and maybe new Refresh Token).
User continues using app without re-logging in.


# controllers

# user registration: 
1. Get the user details from frontend.
2. validations : check email if it is correct and not empty
3. check if user already exists  : using username and email
4. check if files are provided or not (avatar and cover image)
5. upload the images to cloudinary
6. create user object - create entry in db
7. remove password and refresh token field from response
8. check for user creation
9. return response or error if not formed user

