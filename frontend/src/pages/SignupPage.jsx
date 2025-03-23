import { useState } from "react"
import { useAuthStore } from "../store/useAuthStore"
import { EyeIcon, EyeOff, Loader, Lock, Mail, MessageSquare, User } from "lucide-react"
import AuthImagePattern from "../components/AuthImagePattern"
import toast from "react-hot-toast"

const SignupPage = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    })

    const { signup, isSigningUp } = useAuthStore()

    const validateForm = () => {
        if (!formData.name.trim()) return toast.error("Full Name is required")
        if (!formData.email.trim()) return toast.error("Email is required")
        if (!/^\S+@\S+\.\S+$/.test(formData.email)) return toast.error("Invalid email format")
        if (!formData.password.trim()) return toast.error("Password is required")
        if (formData.password.length < 6) return toast.error("Password must be at least 6 characters long")

        return true
    }

    const handleSubmit = (e) => {
        e.preventDefault()  //! Prevents the default action of the form and stops the page from refreshing
        if (validateForm()) {
            signup(formData)
        }
    }


    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side form */}
            <div className="flex flex-col items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center mb-8 ">
                        <div className="flex flex-col items-center gap-2 group">
                            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <MessageSquare className="size-6 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold mt-2">Create Account</h1>
                            <p className="text-base-content/60">Get started with your free account</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="form-control">
                            <label htmlFor="" className="label">
                                <span className="label-text font-medium">Full Name</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <User className="size-5 text-base-content/40 z-10" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    className="input input-bordered pl-10 w-full"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-control">
                            <label htmlFor="" className="label">
                                <span className="label-text font-medium">Email</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Mail className="size-5 text-base-content/40 z-10" />
                                </div>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    className="input input-bordered pl-10 w-full"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-control">
                            <label htmlFor="" className="label">
                                <span className="label-text font-medium">Password</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Lock className="size-5 text-base-content/40 z-10" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="********"
                                    className="input input-bordered pl-10 w-full"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-5 text-base-content/40" />
                                    ) : (
                                        <EyeIcon className="size-5 text-base-content/40" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={isSigningUp}
                        >
                            {isSigningUp ? (
                                <div className="flex items-center gap-2">
                                    <Loader className="size-5 animate-spin" />
                                    <span>Signing Up</span>
                                </div>
                            ) : (
                                "Sign Up"
                            )}
                        </button>
                    </form>

                    <div className="text-center">
                        <p className="text-base-content/60">
                            Already have an account?{" "}
                            <a href="/login" className="text-primary">
                                Login
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side */}
            <AuthImagePattern
                title="Join our community"
                subtitle="Connect with friend, share moments, and stay in touch with your loved ones."
            />
        </div>
    )
}

export default SignupPage