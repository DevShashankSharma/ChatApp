import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Send, Image } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

const MessageInput = () => {
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const { sendMessage } = useChatStore();
    const { startTyping, stopTyping } = useChatStore();
    const { authUser } = useAuthStore();
    const typingTimeoutRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file.");
            return;
        };

        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    }

    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
    }

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() && !imagePreview) return;

        try {
            await sendMessage({
                text: text.trim(),
                image: imagePreview,
            });

            // Clear the text and image in form
            setText("");
            setImagePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            // stop typing after send
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            stopTyping(useChatStore.getState().selectedUser?._id);
        } catch (error) {
            console.log("Failed to sending message", error);
        }
    }

    

    return (
        <div className="p-4 w-full message-input-wrap">
            {imagePreview && (
                <div className="mb-3 flex items-center gap-2">
                    <div className="relative">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
                        />
                        <button
                            onClick={removeImage}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
                                flex items-center justify-center"
                            type="button"
                        >
                            <X className="size-3" />
                        </button>
                    </div>
                </div>
            )}


            <form onSubmit={handleSendMessage} className="flex items-center gap-2" aria-label="Send message form">
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        className="w-full input input-bordered rounded-lg input-sm sm:input-md bg-transparent"
                        placeholder="Type a message..."
                        aria-label="Message text"
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            // emit typing with debounce
                            const receiverId = useChatStore.getState().selectedUser?._id;
                            if (!receiverId || !authUser) return;
                            startTyping(receiverId);
                            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                            typingTimeoutRef.current = setTimeout(() => {
                                stopTyping(receiverId);
                            }, 1500);
                        }}
                    />
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} aria-label="Attach image" />

                    <button type="button" aria-label="Attach image" className={`hidden sm:flex btn btn-circle btn-ghost-soft ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`} onClick={() => fileInputRef.current?.click()}>
                        <Image size={20} />
                    </button>
                </div>

                <button
                    type="submit"
                    className={"btn btn-sm btn-circle btn-primary-glow" + (!text.trim() && !imagePreview ? " opacity-60 cursor-not-allowed" : " animate-send")}
                    disabled={!text.trim() && !imagePreview}
                    aria-label="Send message"
                >
                    <Send size={22} />
                </button>
            </form>
        </div>
    )
}

export default MessageInput