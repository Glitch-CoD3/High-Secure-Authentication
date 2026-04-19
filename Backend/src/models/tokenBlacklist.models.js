import mongoose, { Schema } from 'mongoose'

const blacklistSchema = new Schema({
    token: {
        type: String,
        required: [true, 'Token is required to be added to the blacklist']
    }
}, { timestamps: true })

export const tokenBlacklist = mongoose.model('TokenBlacklist', blacklistSchema)