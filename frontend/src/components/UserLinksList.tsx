import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "./ui/spinner";
import { deleteUrl } from "../lib/authApi";

interface UserUrl {
  shortUrl: string;
  shortCode: string;
  longUrl: string;
  created_at: string;
}

interface UserUrlsResponse {
  urls: UserUrl[];
}

function UserLinksList() {
  const [error, setError] = useState<string>("");
  const [deletingShortCode, setDeletingShortCode] = useState<string | null>(
    null
  );
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error: fetchError,
  } = useQuery<UserUrlsResponse, Error>({
    queryKey: ["user-urls"],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/urls`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to load URLs" }));
        throw new Error(errorData.error || "Failed to load URLs");
      }

      return response.json();
    },
  });

  const handleDelete = async (shortCode: string) => {
    if (deletingShortCode) return;
    const confirmed = window.confirm("Delete this shortened URL?");
    if (!confirmed) return;

    try {
      setDeletingShortCode(shortCode);
      await deleteUrl(shortCode);
      await queryClient.invalidateQueries({ queryKey: ["user-urls"] });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete URL";
      setError(message);
    } finally {
      setDeletingShortCode(null);
    }
  };

  const urls = data?.urls ?? [];

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/60 rounded-2xl shadow-2xl p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-100 tracking-wide">
            Your shortened URLs
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Click to open a link, or remove ones you no longer need.
          </p>
        </div>
        {urls.length > 0 && (
          <span className="text-xs text-gray-500">{urls.length} total</span>
        )}
      </div>

      {error && (
        <div className="mb-3 bg-red-900/30 border border-red-700/60 text-red-300 px-4 py-2 rounded-xl text-xs">
          {error}
        </div>
      )}

      {fetchError && !error && (
        <div className="mb-3 bg-red-900/30 border border-red-700/60 text-red-300 px-4 py-2 rounded-xl text-xs">
          {(fetchError as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center text-sm text-gray-400 py-6">
          <Spinner className="-ml-1 mr-2" />
          Loading your URLs...
        </div>
      ) : urls.length === 0 ? (
        <p className="text-xs text-gray-500 py-4">
          You haven&apos;t shortened any URLs yet. Create your first link to see
          it here.
        </p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {urls.map((item) => {
            const isDeleting = deletingShortCode === item.shortCode;
            return (
              <div
                key={item.shortCode}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/70 hover:border-indigo-500/60 hover:bg-slate-900 transition-colors duration-150 flex items-start gap-3"
              >
                <button
                  type="button"
                  onClick={() => {
                    window.open(item.shortUrl, "_blank");
                  }}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm text-indigo-300 truncate">
                      {item.shortUrl}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400 truncate">
                    {item.longUrl}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(item.shortCode)}
                  disabled={isDeleting}
                  className="shrink-0 inline-flex items-center justify-center rounded-md border border-red-700/60 text-red-300 text-xs px-2 py-1 hover:bg-red-900/40 hover:border-red-500/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                  aria-label={`Delete URL ${item.shortUrl}`}
                >
                  {isDeleting ? <Spinner className="h-3 w-3" /> : "Delete"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserLinksList;


