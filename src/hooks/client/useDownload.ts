import { useCallback, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { apiService } from "@/services/api.service";
import { NetworkError, ClientPortalError } from "@/types/client/enhanced.types";

interface DownloadOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useDownload = () => {
  const [downloading, setDownloading] = useState(false);
  const { showToast } = useToast();

  const download = useCallback(
    async (url: string, filename: string, options?: DownloadOptions) => {
      setDownloading(true);

      try {
        const response = await apiService.get(url, { responseType: "blob" });

        // Create blob URL
        const blob = new Blob([response.data]);
        const blobUrl = window.URL.createObjectURL(blob);

        // Create temporary link and trigger download
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        showToast("success", "Download started successfully");
        options?.onSuccess?.();
      } catch (error) {
        console.error("Download failed:", error);

        let err: Error;
        if (error instanceof Error) {
          err = error;
        } else if (
          typeof error === "object" &&
          error !== null &&
          "status" in error
        ) {
          err = new NetworkError("Download failed", (error as any).status);
        } else {
          err = new ClientPortalError("An unexpected download error occurred");
        }

        showToast("error", err.message);
        options?.onError?.(err);
      } finally {
        setDownloading(false);
      }
    },
    [showToast],
  );

  return {
    download,
    downloading,
  };
};
