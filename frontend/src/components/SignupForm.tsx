import { FormEvent, useState } from "react";
import { Form } from "./ui/form";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { useAuth } from "../context/AuthContext";
import { register } from "../lib/authApi";

interface SignupFormProps {
  onSwitchToLogin?: () => void;
}

function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password);
      // Auto-login after successful registration
      await login(email, password);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to create account. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">
          Create an account
        </h2>
        <p className="text-sm text-gray-400">
          Sign up to access your dashboard and manage shortened URLs
        </p>
      </div>

      <Form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all duration-200 hover:border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="you@example.com"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all duration-200 hover:border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="••••••••"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="signup-confirm-password"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Confirm password
          </label>
          <input
            id="signup-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all duration-200 hover:border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="••••••••"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 mt-2"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Spinner className="-ml-1 mr-2" />
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </Button>

        {onSwitchToLogin && (
          <p className="mt-4 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-indigo-400 hover:text-indigo-300 font-medium underline-offset-4 hover:underline"
            >
              Sign in
            </button>
          </p>
        )}
      </Form>
    </div>
  );
}

export default SignupForm;


