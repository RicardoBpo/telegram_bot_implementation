import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userId: Number,
    userName: String,
    phoneNumber: String,
    country: String
});


export default mongoose.model("User", userSchema);