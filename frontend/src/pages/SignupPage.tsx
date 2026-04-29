import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearSession, getCurrentUser, getToken, saveSession, signup } from "../services/AuthService";
import axios from "axios";
import { FiEye, FiEyeOff } from "react-icons/fi";

const SignupPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setError("");
    try {
      const { token, user } = await signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      saveSession(token, user);
      navigate("/todos");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object"
          ? (err.response.data as any).message
          : undefined;
      setError(message || "Signup failed. Please try again.");
    }
  };

  const token = getToken();
  const currentUser = getCurrentUser();

  return (
    <div className="min-h-screen w-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Signup</h1>
        <p className="text-gray-500 mb-6">Create your account to start managing todos.</p>
        {token && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center justify-between gap-3">
            <span>Logged in as {currentUser?.email}. Click switch to create another account.</span>
            <button
              type="button"
              onClick={() => clearSession()}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
            >
              Switch
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition"
          >
            Signup
          </button>
        </form>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <p className="text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-teal-600 font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
