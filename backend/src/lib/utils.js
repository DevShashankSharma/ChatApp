import jwt from 'jsonwebtoken';

export const generateToken = (userId , res) => {

    //! create token
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });

    //! set token in cookie
    res.cookie('jwt', token, {
        httpOnly: true,  // cannot be accessed by client side scripts  ! prevent XSS attacks
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',  // csrf(cross site request forgery) protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // Max-Age=604800; 7 days
    });

    return token;
}