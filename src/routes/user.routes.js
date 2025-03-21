import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router(); //jaise express se app bna rhe the router se route bnayenge

router.route("/register").post(registerUser) //http://localhost:8000/api/v1/users/register pe jane pe ye wla registerUser method call hoga



export default router;