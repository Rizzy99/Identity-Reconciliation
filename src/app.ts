import express from "express";
import cors from "cors";
import contactRoutes from "./routes/contactRoutes";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", contactRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

