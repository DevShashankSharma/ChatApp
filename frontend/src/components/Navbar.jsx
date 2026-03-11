import { LogOut, MessagesSquare, Settings, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
const Navbar = () => {
    const { authUser, logout, isAdmin } = useAuthStore();
    return (
        <header className="topbar fixed w-full top-0 z-40 p-4">
                <div className="container mx-auto px-4 h-6">
                    <div className="flex items-center justify-between h-full">
                    {/* {left side} */}
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-all">
                            <div className="size-9 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#8b7bff] flex items-center justify-center shadow-md avatar-ring">
                                <MessagesSquare className="size-5 text-white" />
                            </div>
                            <h1 className="text-lg font-bold brand-badge">Chatify</h1>
                        </Link>
                    </div>

                    {/* { right side} */}
                    <div className="flex items-center gap-2">
                        <Link to="/settings" className="btn btn-sm btn-ghost-soft" aria-label="Settings">
                            <Settings className="size-4" />
                            <span className="hidden sm:inline">Settings</span>
                        </Link>

                        <Link to="/meeting" className="btn btn-sm btn-ghost-soft" aria-label="Meetings">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            <span className="hidden sm:inline">Meet</span>
                        </Link>

                        {authUser && (
                            <>
                                {isAdmin && (
                                    <Link to="/admin/announcements" className="btn btn-sm" aria-label="Admin announcements">
                                        Admin
                                    </Link>
                                )}
                                <Link to="/profile" className="btn btn-sm gap-2 btn-ghost-soft" aria-label="Profile">
                                    <User className="size-5" />
                                    <span className="hidden sm:inline">Profile</span>
                                </Link>

                                <button onClick={logout} className="flex gap-2 items-center btn-ghost-soft" aria-label="Logout">
                                    <LogOut className="size-5" />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </>
                        )}

                    </div>
                </div>
            </div>
        </header>
    )
}

export default Navbar