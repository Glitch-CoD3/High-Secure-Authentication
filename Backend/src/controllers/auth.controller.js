import { User } from '../models/user.models.js';
// import { tokenBlacklist } from '../models/blacklist.models.js';
import { Session } from '../models/session.models.js';
import { sendEmail } from '../services/email.js';
import { OTP } from '../models/otp.models.js';
import { getOtpHtml, generateOTP } from '../utils/utils.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

/**
 * @name generateRefreshToken
 * @description generate refresh token for user
 *@access public 
 */
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    )
}

/**
 * @name generateAccessToken
 * @description generate access token for user
 *@access public 
 */

const generateAccessToken = (userId, SassionId) => {
    return jwt.sign(
        {
            id: userId,
            SassionId: SassionId,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    )
}

/**
 * @name userRegister
 * @description Register a new user expects username, email and password in the request body
 *@access public 
 */

const userRegister = async (req, res) => {
    try {
        const { username, email, password } = req.body;


        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            username,
            email,
            password
        });


        const otpCode = generateOTP();
        const html = getOtpHtml(otpCode);

        const otpHash = await bcrypt.hash(otpCode, 10);

        await OTP.create({
            user: user._id,
            email: email,
            otpHashed: otpHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        })


        await sendEmail(email, 'Verify Your Account', `Your OTP code is ${otpCode}`, html);


        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                verified: user.verified
            }
        });

    } catch (error) {
        console.log("REGISTER ERROR:", error);
        return res.status(500).json({
            message: 'Server error from userRegister',
            error: error.message
        });
    }
};


/**
 * @name loginUser
 * @description Sign in an existing user expects email and password in the request body
 *@access public 
 */

const loginUser = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if ((!email && !username) || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const user = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.verified) {
            return res.status(400).json({ message: 'Email not verified' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }


        const refreshToken = generateRefreshToken(user._id);

        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

        const session = await Session.create({
            user: user._id,
            refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        const accessToken = generateAccessToken(user._id, session._id);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 15 * 60 * 1000
        });


        return res.status(200).json({
            message: 'User logged in successfully',
            user: {
                id: user._id,
                username: user.username,
            },
            accessToken
        });

    } catch (error) {
        console.log("LOGIN ERROR:", error);
        return res.status(500).json({ message: 'Server error' });
    }
};


/**
 * @name logOutUser
 * @description Log out the current user and add their token to the blacklist
 *@access public 
 */

const logOutUser = async (req, res) => {
    try {
        // Step 1: Extract refresh token
        const refreshToken = req.cookies?.refreshToken || req.headers.authorization?.split(' ')[1];

        // Step 2: Validate token existence
        if (!refreshToken) {
            return res.status(400).json({ message: "No refresh token provided" });
        }

        // Step 3: Verify JWT and extract userId
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);


        // Step 4: Find session using userId (fast lookup)
        const session = await Session.findOne({
            userId: decoded._id,
            revoked: false
        });

        // Step 5: If no session → invalid
        if (!session) {
            return res.status(400).json({ message: "Invalid refresh token for session not found" });
        }

        // Step 6: Compare token with stored hash
        const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid refresh token" });
        }

        // Step 7: Revoke session
        session.revoked = true;
        await session.save();

        // Step 8: Clear cookie
        res.clearCookie("refreshToken");

        // Step 9: Success response
        return res.status(200).json({
            message: "User logout successfully"
        });

    } catch (error) {
        // Step 10: Handle errors (invalid token, expired, etc.)
        return res.status(500).json({
            message: "Server Error From Logout"
        });
    }
};


/**
 * @name logOutAllDevices
 * @description Log out the current user from all devices
 *@access private 
 */

const logOutAllDevices = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.headers.authorization?.split(' ')[1];

        if (!refreshToken) {
            return res.status(400).json({ message: "No refresh token provided" });
        }

        const decode = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        await Session.updateMany({
            userId: decode._id,
            revoked: false
        }, {
            revoked: true
        })

        res.clearCookie("refreshToken");

        return res.status(200).json({
            message: "User logged out from all devices successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server Error From Logout All Devices"
        });
    }
}

/**
 * @name refresh
 * @description Refresh the access token using the refresh token also generate new refresh token and send it in the response
 *@access public 
 */

const refresh = async (req, res) => {
    try {
        // Step 1: Extract refresh token from cookies or Authorization header
        const refreshToken = req.cookies?.refreshToken || req.headers?.authorization?.split(' ')[1];

        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" })
        }

        // Step 3: decode
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Step 4: Find session using hashed refresh token and ensure it's not revoked
        const session = await Session.findOne({
            userId: decoded._id,
            revoked: false
        });


        // Step 5: If no session found, token is invalid
        if (!session) {
            return res.status(400).json({ message: "Invalid refresh token for session not found" });
        }

        // Step 6: Generate a new access token using session/user ID
        const newAccessToken = generateAccessToken(session.user, session._id);

        // Step 7: Generate a new refresh token (token rotation)
        const newRefreshToken = generateRefreshToken(session.user, session._id);

        // Step 8: Hash the new refresh token
        const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

        session.refreshTokenHash = newRefreshTokenHash;
        await session.save();

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });


        return res.status(200).json({
            accessToken: newAccessToken
        });


    } catch (error) {
        res.status(500).json({
            message: "server Error From Refresh"
        })
    }
}


/**
 * @name verifyEmail
 * @description Verify the user's email address using the provided OTP
 *@access public 
 */

const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const otpRecord = await OTP.findOne({ email });

        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        const isMatch = await bcrypt.compare(otp, otpRecord.otpHashed);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.verified = true;
        await user.save();

        const deleteOtp = await OTP.deleteMany({
            user: user._id,
        })

        return res.status(200).json({ message: "Email verified successfully" });

    } catch (error) {
        return res.status(500).json({
            message: "Server Error From Verify Email"
        });
    }
}

export { userRegister, loginUser, logOutUser, logOutAllDevices, refresh, verifyEmail }