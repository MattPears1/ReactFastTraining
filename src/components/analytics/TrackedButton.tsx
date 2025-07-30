import React from "react";
import Button, { ButtonProps } from "@/components/ui/Button";
import { useAnalytics } from "@/hooks/useAnalytics";

interface TrackedButtonProps extends ButtonProps {
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  eventValue?: number;
  trackingProps?: Record<string, any>;
}

export const TrackedButton: React.FC<TrackedButtonProps> = ({
  eventCategory = "button",
  eventAction = "click",
  eventLabel,
  eventValue,
  trackingProps,
  onClick,
  children,
  ...props
}) => {
  const { trackEvent } = useAnalytics();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Track the event
    trackEvent({
      category: eventCategory,
      action: eventAction,
      label:
        eventLabel ||
        props.id ||
        (typeof children === "string" ? children : "button"),
      value: eventValue,
      properties: trackingProps,
    });

    // Call original onClick handler
    onClick?.(e);
  };

  return (
    <Button {...props} onClick={handleClick}>
      {children}
    </Button>
  );
};
