import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
    try {
        //! Get token from cookie
        const token = req.cookies.jwt;

        //! Check if token exists
        if (!token) { 
            return res.status(401).json({ message: 'Unauthorized - No token Provided' });
        }

        //! Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //! Check if user exists
        if(!decoded) {
            return res.status(401).json({ message: 'Unauthorized - Invalid token' });
        }

        //! Get user from token
        const user = await User.findById(decoded.id).select('-password');
        // console.log(decoded);
        if(!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        //! Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.log("Error in protectRoute Middleware", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};