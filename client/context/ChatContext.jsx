import { useContext, useState, useEffect, createContext } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, axios } = useContext(AuthContext);

    // Fetch all users and unseen messages
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            setUsers(data.users);
            setUnseenMessages(data.unseenMessages || {});
        } catch (error) {
            toast.error("Failed to load users");
        }
    };

    // Fetch messages for a selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
                // Reset unseen messages count for this user
                setUnseenMessages(prev => ({ ...prev, [userId]: 0 }));
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Send message to backend and emit via socket
    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                // Add message locally
                setMessages(prev => [...prev, data.newMessage]);
                // Emit to recipient via socket
                socket?.emit("sendMessage", {
                    to: selectedUser._id,
                    message: data.newMessage
                });
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Handle incoming messages
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                // Current chat is open, mark as seen
                setMessages(prev => [...prev, newMessage]);
            } else {
                // Increment unseen count for the sender
                setUnseenMessages(prev => ({
                    ...prev,
                    [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
                }));
            }
        };

        socket.on("newMessage", handleNewMessage);

        return () => socket.off("newMessage", handleNewMessage);
    }, [socket, selectedUser]);

    return (
        <ChatContext.Provider value={{
            messages,
            users,
            selectedUser,
            getUsers,
            getMessages,
            sendMessage,
            setSelectedUser,
            unseenMessages,
            setUnseenMessages
            
        }}>
            {children}
        </ChatContext.Provider>
    );
};
