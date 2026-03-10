import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
        },
        image: {
            type: String,
        },
        // whether the message was edited
        edited: {
            type: Boolean,
            default: false,
        },
        // mark message deleted (for everyone or for specific users)
        deleted: {
            type: Boolean,
            default: false,
        },
        // users who have read the message
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        ],
        // reactions: array of { userId, emoji }
        reactions: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                emoji: { type: String },
                createdAt: { type: Date, default: Date.now }
            }
        ],
        // thread replies reference
        threadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        // attachments (other than image) — urls
        attachments: [
            {
                url: String,
                filename: String,
                mimeType: String,
            }
        ],
        // support for group messages
        isGroup: {
            type: Boolean,
            default: false,
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
        },
    },
    { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;