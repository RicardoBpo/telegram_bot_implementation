import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userId: Number,
    userName: String,
    documentKey: { type: String },
    documentUrl: { type: String },
    documentName: { type: String },
    participantName: { type: String },
    token: { type: String },
    signerId: { type: String },
    phoneNumber: String,
    country: String,
    termsAccepted: Boolean,
    identityStep: String,
    documentType: String,
    awaitingFirmaUpload: Boolean,
    awaitingSignature: Boolean,
    faceRecognition: {
        fileId: String,
        fileName: String,
        verified: Boolean,
    },
    lastActivity: Date,
    sessionBlocked: { type: Boolean, default: false },
    sessionAuditLog: [
        {
            event: String,
            timestamp: Date
        }
    ]
});


export default mongoose.model("User", userSchema);