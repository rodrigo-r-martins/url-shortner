import { useState, FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Form } from "./ui/form";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";

interface ShortenUrlResponse {
  shortUrl: string;
  shortCode: string;
  longUrl: string;
}

function UrlShortenerForm() {
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  const validateUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const mutation = useMutation<ShortenUrlResponse, Error, string>({
    mutationFn: async (urlToShorten: string): Promise<ShortenUrlResponse> => {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const allowedOrigin =
        import.meta.env.VITE_ALLOWED_ORIGIN || "http://localhost:5173";
      const response = await fetch(`${apiUrl}/api/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": allowedOrigin,
        },
        body: JSON.stringify({ url: urlToShorten }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to shorten URL" }));
        throw new Error(errorData.error || "Failed to shorten URL");
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Shortened URL:", data);
      setUrl("");
      setError("");
    },
    onError: (error: Error) => {
      setError(error.message || "Failed to shorten URL");
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!validateUrl(url)) {
      setError(
        "Please enter a valid URL (must start with http:// or https://)"
      );
      return;
    }

    mutation.mutate(url);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl p-8 hover:border-slate-600/50 transition-all duration-300">
      <Form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="url"
            className="block text-sm font-medium text-gray-300 mb-3 tracking-wide"
          >
            Enter URL to shorten
          </label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/very/long/url"
            className="w-full px-5 py-3.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all duration-200 hover:border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={mutation.isPending}
          />
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-5 py-3.5 rounded-xl text-sm backdrop-blur-sm">
            {error}
          </div>
        )}

        {mutation.isSuccess && mutation.data && (
          <div className="bg-emerald-900/30 border border-emerald-700/50 text-emerald-300 px-5 py-3.5 rounded-xl text-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-medium">
                Shortened URL:
              </span>
              <span
                className="font-mono text-emerald-300 bg-emerald-900/20 px-3 py-1 rounded-md border border-emerald-700/30 hover:text-emerald-400 transition-all duration-200 cursor-pointer"
                onClick={() => {
                  window.open(mutation.data.shortUrl, "_blank");
                }}
              >
                {mutation.data.shortUrl}
              </span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full h-12"
        >
          {mutation.isPending ? (
            <span className="flex items-center justify-center">
              <Spinner className="-ml-1 mr-2" />
              Shortening...
            </span>
          ) : (
            "Shorten URL"
          )}
        </Button>
      </Form>
    </div>
  );
}

export default UrlShortenerForm;
