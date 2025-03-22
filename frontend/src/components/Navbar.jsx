import { useAuthStore } from "../store/useAuthStore";
const Navbar = () => {
    const { AuthUser } = useAuthStore();
    return (
        <div>
            <h1>Navbar</h1>
        </div>
    )
}

export default Navbar