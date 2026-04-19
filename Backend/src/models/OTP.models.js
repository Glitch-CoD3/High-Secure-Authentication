import mongoose, { Schema } from 'mongoose'
const otpSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    otpHashed: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });


export const OTP = mongoose.model('OTP', otpSchema)