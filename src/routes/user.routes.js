import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  renewAccessToken,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router(); //jaise express se app bna rhe the router se route bnayenge

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
); //http://localhost:8000/api/v1/users/register pe jane pe ye wla registerUser method call hoga
//upload ia s middleware (multer)  used to upload the files like avatar, cover image etc.

router.route("/login").post(loginUser);

//secured routes (Here verifyJWT is a middleware). It gives access of req.user to the logoutUser method
router.route("/logout").post(verifyJWT, logoutUser);


//to renew refresh token
router.route("/refresh-token").post(renewAccessToken);

export default router;
