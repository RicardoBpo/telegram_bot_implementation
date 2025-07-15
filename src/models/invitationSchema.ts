import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema({
    token: { 
        type: String,
        required: true,
        unique: true
    },
    userId: { 
        type: Number,
        required: true
    },
    documentId: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    expiresAt: { 
        type: Date, 
        required: true 
    }
});

export default mongoose.model("Invitation", invitationSchema);