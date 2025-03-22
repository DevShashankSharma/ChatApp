import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        //! Get all users except the logged in user
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        //! Send the filtered users
        res.status(200).json({ filteredUsers });
    } catch (error) {
        console.log("Error in getUsersForSidebar Controller", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getMessages = async (req, res) => {
    try {
        //! Get the user to chat with
        const { id: userToChatId } = req.params;

        //! Get the logged in user
        const myId = req.user._id;


        //! Get all messages between the logged in user and the user to chat with
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        });

        res.status(200).json({
            messages
        });
    }
    catch (error) {
        console.log("Error in getMessages Controller", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}


export const sendMessage = async (req, res) => {
    try {
        //! Get the receiver id, sender id, text and image from the request body
        const { id: receiverId } = req.params;
        const senderId = req.user._id;
        const { text, image } = req.body;

        //! Create a image url if image is present
        let imageUrl;
        if (image) {
            //! Upload the image to cloudinary and get the image url
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        //! Create a new message
        const newMessage = await Message.create({  
            senderId: senderId,
            receiverId: receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();

        //!! Todo : realtime functionality goes here => Socket.io 

        res.status(201).json({ newMessage });
    }
    catch (error) {
        console.log("Error in sendMessage Controller", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}