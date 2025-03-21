import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from './routes/user.routes.js' //manchaha name tabhi de skte hain jab export default ho


//routes declaration
app.use("/api/v1/users", userRouter)   //koi v user likega /users control will shift to userRouter middleware


//http://localhost:8000/api/v1/users/register

export { app };