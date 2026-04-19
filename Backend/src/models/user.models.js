import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: [true, 'Username must be unique']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email must be unique']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        length: [8, 'Password must be at least 8 characters']
    },

    verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })


userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 10);

})

export const User = mongoose.model('User', userSchema)