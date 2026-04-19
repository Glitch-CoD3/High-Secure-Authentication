import mongoose from 'mongoose'
import { DB_NAME } from '../constant.js'

export const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(
            `\n✅ MongoDB connected! DB Host: ${connectionInstance.connection.host}`
        );

    } catch (err) {
        console.log('MongoDB connection error:', err.message);
        process.exit(1); // Exit the app if DB connection fails
    }
}