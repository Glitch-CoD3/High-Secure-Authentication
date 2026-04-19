import mongoose, { Schema } from 'mongoose'
import { User } from './user.models.js'

const sessionSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: [true, 'User reference is required']
    },

    refreshTokenHash: {
        type: String,
        required: [true, 'Refresh token hash is required']
    },

    ip: {
        type: String,
        required: [true, 'IP address is required']
    },

    userAgent: {
        type: String,
        required: true,
    },

    revoked: {
        type: Boolean,
        default: false,
    }


}, { timestamps: true })

export const Session = mongoose.model('Session', sessionSchema)