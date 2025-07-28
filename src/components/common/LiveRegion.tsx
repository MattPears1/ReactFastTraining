import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface LiveRegionProps {
  message: string;
  type?: "polite" | "assertive";
  clearDelay?: number;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  type = "polite",
  clearDelay = 1000,
}) => {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (regionRef.current && message) {
      regionRef.current.textContent = message;

      const timer = setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = "";
        }
      }, clearDelay);

      return () => clearTimeout(timer);
    }
  }, [message, clearDelay]);

  return createPortal(
    <div
      ref={regionRef}
      role="status"
      aria-live={type}
      aria-atomic="true"
      className="sr-only"
    />,
    document.body,
  );
};

// Hook for easier usage
export const useLiveRegion = () => {
  const [announcement, setAnnouncement] = React.useState("");
  const [type, setType] = React.useState<"polite" | "assertive">("polite");

  const announce = (
    message: string,
    announceType: "polite" | "assertive" = "polite",
  ) => {
    setType(announceType);
    setAnnouncement(message);

    // Clear after announcement
    setTimeout(() => setAnnouncement(""), 100);
  };

  return {
    announce,
    liveRegion: <LiveRegion message={announcement} type={type} />,
  };
};

export default LiveRegion;
