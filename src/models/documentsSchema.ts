import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
    userId: String,
    fileId: String,
    fileName: String,
});

export default mongoose.model("Document", DocumentSchema);