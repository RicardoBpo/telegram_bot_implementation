import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userId: Number,
    userName: String,
    phoneNumber: String,
    country: String,
    termsAccepted: Boolean,
    identityStep: String,
    documentType: String,
    faceRecognition: {
        fileId: String,
        fileName: String,
        verified: Boolean,
    },
});


export default mongoose.model("User", userSchema);