import { Router } from "express";

import * as subController from "../controllers/sub.controller.js";

const subRouter = Router();

subRouter.get("/:userId", subController.getUserSub);

subRouter.post("/:subId/cancel", subController.cancelOrResub);

subRouter.post("/:subId/change-plan", subController.changePlan);

export default subRouter;
