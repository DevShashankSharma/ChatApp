import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Helper: emit to receiver if online
const emitToReceiver = (receiverId, event, payload) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) io.to(receiverSocketId).emit(event, payload);
}

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
        // Exclude messages that have been deleted for everyone (deleted: true)
        const messages = await Message.find({
            $and: [
                {
                    $or: [
                        { senderId: myId, receiverId: userToChatId },
                        { senderId: userToChatId, receiverId: myId },
                    ],
                },
                { deleted: { $ne: true } }
            ]
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
            isGroup: false,
            attachments: req.body.attachments || [],
        });

        await newMessage.save();

        // realtime: emit newMessage
        emitToReceiver(receiverId, "newMessage", newMessage);

        res.status(201).json(newMessage);
    }
    catch (error) {
        console.log("Error in sendMessage Controller", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}

export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        if (String(message.senderId) !== String(userId)) return res.status(403).json({ message: 'Not authorized' });

        message.text = text;
        message.edited = true;
        await message.save();

        // emit edit to receiver
        emitToReceiver(message.receiverId, 'editMessage', message);

        res.status(200).json({ message });
    } catch (error) {
        console.log('Error in editMessage Controller', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { forEveryone } = req.query; // optional
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        if (String(message.senderId) !== String(userId)) return res.status(403).json({ message: 'Not authorized' });

        if (forEveryone === 'true') {
            message.deleted = true;
            await message.save();
            emitToReceiver(message.receiverId, 'deleteMessage', { messageId });
            return res.status(200).json({ message: 'Message deleted for everyone' });
        }

        // delete only for sender -> keep in DB but mark deleted for sender is not tracked here; client can remove locally
        await Message.findByIdAndDelete(messageId);
        emitToReceiver(message.receiverId, 'deleteMessage', { messageId });
        res.status(200).json({ message: 'Message deleted' });
    } catch (error) {
        console.log('Error in deleteMessage Controller', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const markAsRead = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // add to readBy if not present
        if (!message.readBy.find(id => String(id) === String(userId))) {
            message.readBy.push(userId);
            await message.save();
        }

        // notify sender
        emitToReceiver(message.senderId, 'messageRead', { messageId, readerId: userId });

        res.status(200).json({ message: 'Marked as read' });
    } catch (error) {
        console.log('Error in markAsRead Controller', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const addReaction = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // toggle reaction: if exists remove, else add
        const existingIndex = message.reactions.findIndex(r => String(r.userId) === String(userId) && r.emoji === emoji);
        if (existingIndex > -1) {
            message.reactions.splice(existingIndex, 1);
        } else {
            message.reactions.push({ userId, emoji });
        }

        await message.save();

        // notify receiver/sender
        emitToReceiver(message.receiverId, 'reaction', message);
        emitToReceiver(message.senderId, 'reaction', message);

        res.status(200).json({ message });
    } catch (error) {
        console.log('Error in addReaction Controller', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const searchMessages = async (req, res) => {
    try {
        const { q } = req.query;
        const userId = req.user._id;

        if (!q) return res.status(400).json({ message: 'Query required' });

        // search in messages where user is sender or receiver
        const results = await Message.find({
            $and: [
                { $or: [ { senderId: userId }, { receiverId: userId } ] },
                { text: { $regex: q, $options: 'i' } }
            ]
        });

        res.status(200).json({ results });
    } catch (error) {
        console.log('Error in searchMessages Controller', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}