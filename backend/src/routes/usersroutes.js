// backend/src/routes/usersroutes.js

import { Router } from "express";
import { login, register } from "../controllers/user.controller.js";

const router = Router();

// STEP 1 (sir's stage 1)
// router.route("/login");
// router.route("/register");
// router.route("/add_to_activity");
// router.route("/get_all_activity");

// STEP 2 (sir adds POST routes)
router.route("/login").post(login);
router.route("/register").post(register);

// sir will add these later:
router.route("/add_to_activity");
router.route("/get_all_activity");

export default router;
