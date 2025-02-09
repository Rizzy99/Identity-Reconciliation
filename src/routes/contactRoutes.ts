import express from "express";
import { identifyCustomer } from "../controllers/contactController";

const router = express.Router();
router.post("/identify", identifyCustomer);
export default router;

