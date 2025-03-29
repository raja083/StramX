import dotenv from 'dotenv';
dotenv.config();
import connectDB from './db/connection.js';
import express from 'express';
import { app } from './app.js';


//database connection
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

