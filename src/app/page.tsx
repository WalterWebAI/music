"use client";

import { useState } from "react";
import { Music, Download, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setStatus("loading");
    setMessage("Connecting to Spotiflac Server...");

    try {
      const BACKEND_URL = "/api/download";

      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Unknown error from server");
      }

      if (!response.ok) throw new Error("Failed to download");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "track.flac";
      if (contentDisposition && contentDisposition.includes("filename=")) {
        filename = contentDisposition.split("filename=")[1].replace(/["']/g, "");
      }
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setStatus("success");
      setMessage("Downloaded successfully!");
      setUrl("");
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setMessage(error.message || "Failed to connect to the server.");
    }
  };

  return (
    <main className="min-h-screen bg-animated flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-600/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass mb-6 shadow-2xl shadow-purple-500/20">
            <Music className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-4 tracking-tight">
            Spotiflac <span className="text-gradient">Downloader</span>
          </h1>
          <p className="text-lg text-white/70 font-medium">
            Download your favorite tracks in FLAC quality.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 sm:p-10">
          <form onSubmit={handleDownload} className="flex flex-col gap-6">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-semibold text-white/80 uppercase tracking-wider ml-1">
                YouTube Music URL
              </label>
              <div className="relative">
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://music.youtube.com/watch?v=..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="group relative w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-lg rounded-2xl py-4 px-6 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_8px_rgba(168,85,247,0.4)] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                    Download Track
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
          </form>

          {status !== "idle" && (
            <div
              className={`mt-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 ${
                status === "loading"
                  ? "bg-white/5 text-white"
                  : status === "success"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {status === "loading" && <Loader2 className="w-5 h-5 animate-spin" />}
              {status === "success" && <CheckCircle className="w-5 h-5" />}
              {status === "error" && <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{message}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-12 text-center text-white/40 text-sm z-10">
        <p>Ensure your local spotiflac-server.exe is running.</p>
      </div>
    </main>
  );
}
