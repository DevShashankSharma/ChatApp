import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, Send, Image as ImageIcon, Smile } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from 'emoji-picker-react';

const MessageInput = () => {
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef(null);
    
    const { sendMessage, selectedUser } = useChatStore();
    const { socket } = useAuthStore();

    // Typing indicator logic
    useEffect(() => {
        if (!socket || !selectedUser) return;
        
        const timeoutId = setTimeout(() => {
            socket.emit("stopTyping", { chatId: selectedUser._id });
        }, 2000);

        if (text) {
            socket.emit("typing", { chatId: selectedUser._id });
        } else {
            socket.emit("stopTyping", { chatId: selectedUser._id });
        }

        return () => clearTimeout(timeoutId);
    }, [text, socket, selectedUser]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
    };

    const handleEmojiClick = (emojiObject) => {
        setText((prev) => prev + emojiObject.emoji);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() && !imagePreview) return;

        try {
            await sendMessage({
                text: text.trim(),
                image: imagePreview,
            });
            setText("");
            setImagePreview(null);
            setShowEmojiPicker(false);
            socket.emit("stopTyping", { chatId: selectedUser._id }); // Clear typing immediately
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    return (
        <div className="p-4 w-full relative">
            {/* Emoji Picker Popup */}
            {showEmojiPicker && (
                <div className="absolute bottom-20 left-4 z-50 shadow-xl rounded-xl">
                    <EmojiPicker 
                        onEmojiClick={handleEmojiClick} 
                        theme="dark" // or light based on your theme store
                        searchDisabled={true}
                        width={300}
                        height={400}
                    />
                </div>
            )}

            {imagePreview && (
                <div className="mb-3 flex items-center gap-2">
                    <div className="relative group">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
                        />
                        <button
                            onClick={removeImage}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
                                flex items-center justify-center hover:bg-error transition-colors"
                            type="button"
                        >
                            <X className="size-3" />
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="flex-1 flex gap-2 relative">
                    <input
                        type="text"
                        className="w-full input input-bordered rounded-xl input-sm sm:input-md pr-10"
                        placeholder="Type a message..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    
                    {/* Emoji Button */}
                    <button
                        type="button"
                        className="absolute right-12 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-emerald-500 transition-colors"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        <Smile size={20} />
                    </button>

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                    />

                    <button
                        type="button"
                        className={`absolute right-3 top-1/2 -translate-y-1/2 btn btn-circle btn-xs btn-ghost
                                ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon size={20} />
                    </button>
                </div>

                <button
                    type="submit"
                    className="btn btn-circle btn-primary"
                    disabled={!text.trim() && !imagePreview}
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default MessageInput;