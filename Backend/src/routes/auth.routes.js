import { Router } from 'express';
import { loginUser, userRegister, logOutUser, logOutAllDevices, refresh, verifyEmail } from '../controllers/auth.controller.js';

const router = Router()

/**
 * @API POST api/auth/register
 * @description Register a new user
 *@access public 
 */
router.post('/register', userRegister)


/**
 * @API GET api/auth/verify-email
 * @description Verify the user's email address by OTP
 *@access public 
 */

router.post('/verify-email', verifyEmail)

/**
 * @API POST api/auth/login
 * @description Log in an existing user
 *@access public 
 */
router.post('/login', loginUser)

/**
 * @API POST api/auth/logout
 * @description Log out the current user
 *@access public 
 */
router.post('/logout', logOutUser)

/**
 * @API POST api/auth/logout-all
 * @description Log out the current user from all devices
 *@access public 
 */
router.post('/logout-all', logOutAllDevices)


/**
 * @API GET api/auth/refresh
 * @description Refresh the access token using the refresh token
 *@access public 
 */
router.get('/refresh', refresh)


export default router;