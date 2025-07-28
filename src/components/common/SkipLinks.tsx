import React from "react";

interface SkipLink {
  href: string;
  label: string;
}

const skipLinks: SkipLink[] = [
  { href: "#main-content", label: "Skip to main content" },
  { href: "#main-navigation", label: "Skip to navigation" },
  { href: "#footer", label: "Skip to footer" },
];

const SkipLinks: React.FC = () => {
  return (
    <div className="skip-links">
      {skipLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

export default SkipLinks;
