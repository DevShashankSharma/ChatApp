import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/utils.js';
import cloudinary from '../lib/cloudinary.js';

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        //! Check if any field is empty
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        //! Check if password is at least 6 characters long
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        //! find user if already exists
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        //! hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //! create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
        });

        if (newUser) {
            //! generating token
            const token = generateToken(newUser._id, res);

            //! save user
            await newUser.save();

            res.status(201).json({
                message: 'User created successfully',
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                profilePic: newUser.profilePic,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt,
            });
        }
        else {
            console.log("Failed to create user", error.message);
            res.status(500).json({
                message: "Internal server error",
            });
        }

    } catch (error) {
        console.log(error);
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        //! Check if any field is empty
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        //! Check if user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        //! Check if password is correct
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        //! generating token
        const token = generateToken(user._id, res);

        res.status(200).json({
            message: 'User logged in successfully',
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePic: user.profilePic,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        console.log("Failed to login user", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const logout = (req, res) => {
    try {
        res.clearCookie('jwt', "", { maxAge: 0 });
        res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
        console.log("Error in Logout Controller", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};


export const updateProfile = async (req, res) => {
    try {
        //! Get profilePic from request body
        const { profilePic } = req.body;

        //! Get userId from request object
        const userId = req.user._id

        //! Check if profilePic is empty
        if (!profilePic) {
            return res.status(400).json({ message: 'Profile picture is required' });
        }

        //! Upload profilePic to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(profilePic)

        //! Update profilePic in database
        const updatedUser = await User.findByIdAndUpdate(userId, { profilePic: uploadResponse.secure_url }, { new: true });

        res.status(200).json({
            message: 'Profile picture updated successfully',
            updatedUser
        })
    } catch (error) {
        console.log("Error in updateProfile Controller", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const checkAuth = (req, res) => {
    try {
        const user = req.user
        res.status(200).json({
            message: 'User is authenticated',
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePic: user.profilePic,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        console.log("Error in checkAuth Controller", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};