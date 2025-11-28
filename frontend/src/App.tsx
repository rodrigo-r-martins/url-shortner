import { useState } from "react";
import UrlShortenerForm from "./components/UrlShortenerForm";
import Footer from "./components/Footer";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import UserLinksList from "./components/UserLinksList";
import { useAuth } from "./context/AuthContext";
import { Spinner } from "./components/ui/spinner";
import { Button } from "./components/ui/button";

function App() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-300">
          <Spinner size="lg" />
          <p className="text-sm text-gray-400">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex flex-col p-4">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-light text-white mb-2 tracking-tight">
              URL <span className="font-normal text-indigo-400">Shortener</span>
            </h1>
            <p className="text-gray-400 text-base">
              Securely manage and share your personal links
            </p>
          </div>
          {authMode === "login" ? (
            <LoginForm onSwitchToSignup={() => setAuthMode("signup")} />
          ) : (
            <SignupForm onSwitchToLogin={() => setAuthMode("login")} />
          )}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex flex-col p-4">
      <header className="flex items-center justify-between mb-8 max-w-3xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">
            URL <span className="font-normal text-indigo-400">Shortener</span>
          </h1>
          {user && (
            <p className="text-sm text-gray-400 mt-1">
              Signed in as{" "}
              <span className="font-medium text-gray-200">{user.email}</span>
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="border border-slate-700/70 bg-slate-900/40 text-gray-200 hover:bg-slate-800/70 hover:border-slate-500/80 px-3 py-1.5"
          onClick={() => {
            void logout();
          }}
        >
          Logout
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-3xl space-y-6">
          <section className="flex flex-col gap-4">
            <div className="text-left">
              <h2 className="text-2xl font-semibold text-white mb-1 tracking-tight">
                Create a new link
              </h2>
              <p className="text-sm text-gray-400">
                Paste any long URL and we&apos;ll generate a clean, shareable
                short link.
              </p>
            </div>
            <UrlShortenerForm />
          </section>

          <section className="flex flex-col gap-4">
            <div className="text-left">
              <h2 className="text-2xl font-semibold text-white mb-1 tracking-tight">
                Your links
              </h2>
              <p className="text-sm text-gray-400">
                Quickly revisit, share, or manage the URLs you&apos;ve already
                shortened.
              </p>
            </div>
            <UserLinksList />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;

