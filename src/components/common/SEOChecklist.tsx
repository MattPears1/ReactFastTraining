import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface SEOCheck {
  id: string;
  label: string;
  status: "pass" | "fail" | "warning";
  message?: string;
}

const SEOChecklist: React.FC = () => {
  const [checks, setChecks] = useState<SEOCheck[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== "development") return;

    const runSEOChecks = () => {
      const newChecks: SEOCheck[] = [];

      // Check for title
      const title = document.querySelector("title");
      newChecks.push({
        id: "title",
        label: "Page Title",
        status:
          title && title.textContent && title.textContent.length > 0
            ? "pass"
            : "fail",
        message: title?.textContent || "No title found",
      });

      // Check meta description
      const metaDescription = document.querySelector(
        'meta[name="description"]',
      );
      const descriptionContent = metaDescription?.getAttribute("content");
      newChecks.push({
        id: "description",
        label: "Meta Description",
        status:
          descriptionContent && descriptionContent.length >= 50
            ? "pass"
            : descriptionContent && descriptionContent.length > 0
              ? "warning"
              : "fail",
        message: descriptionContent || "No description found",
      });

      // Check Open Graph tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector(
        'meta[property="og:description"]',
      );
      const ogImage = document.querySelector('meta[property="og:image"]');
      newChecks.push({
        id: "og-tags",
        label: "Open Graph Tags",
        status:
          ogTitle && ogDescription && ogImage
            ? "pass"
            : ogTitle || ogDescription || ogImage
              ? "warning"
              : "fail",
        message: `Title: ${ogTitle ? "✓" : "✗"}, Desc: ${ogDescription ? "✓" : "✗"}, Image: ${ogImage ? "✓" : "✗"}`,
      });

      // Check for h1
      const h1Tags = document.querySelectorAll("h1");
      newChecks.push({
        id: "h1",
        label: "H1 Tag",
        status:
          h1Tags.length === 1 ? "pass" : h1Tags.length > 1 ? "warning" : "fail",
        message: `${h1Tags.length} H1 tag(s) found`,
      });

      // Check heading hierarchy
      const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      let hierarchyValid = true;
      let lastLevel = 0;
      headings.forEach((heading) => {
        const level = parseInt(heading.tagName.substring(1));
        if (level > lastLevel + 1) {
          hierarchyValid = false;
        }
        lastLevel = level;
      });
      newChecks.push({
        id: "heading-hierarchy",
        label: "Heading Hierarchy",
        status: hierarchyValid ? "pass" : "warning",
        message: hierarchyValid ? "Valid hierarchy" : "Skipped heading levels",
      });

      // Check images for alt text
      const images = document.querySelectorAll("img");
      const imagesWithoutAlt = Array.from(images).filter((img) => !img.alt);
      newChecks.push({
        id: "alt-text",
        label: "Image Alt Text",
        status:
          imagesWithoutAlt.length === 0
            ? "pass"
            : imagesWithoutAlt.length < images.length / 2
              ? "warning"
              : "fail",
        message: `${imagesWithoutAlt.length} of ${images.length} images missing alt text`,
      });

      // Check canonical URL
      const canonical = document.querySelector('link[rel="canonical"]');
      newChecks.push({
        id: "canonical",
        label: "Canonical URL",
        status: canonical ? "pass" : "warning",
        message: canonical?.getAttribute("href") || "No canonical URL",
      });

      // Check for structured data
      const jsonLdScripts = document.querySelectorAll(
        'script[type="application/ld+json"]',
      );
      newChecks.push({
        id: "structured-data",
        label: "Structured Data",
        status: jsonLdScripts.length > 0 ? "pass" : "warning",
        message: `${jsonLdScripts.length} JSON-LD script(s) found`,
      });

      setChecks(newChecks);
    };

    // Run checks after a delay to ensure page is loaded
    const timer = setTimeout(runSEOChecks, 1000);

    // Re-run on route changes
    const observer = new MutationObserver(() => {
      setTimeout(runSEOChecks, 500);
    });

    observer.observe(document.querySelector("head")!, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
      >
        SEO Checklist ({checks.filter((c) => c.status === "pass").length}/
        {checks.length})
      </button>

      {isVisible && (
        <div className="absolute bottom-full right-0 mb-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-h-96 overflow-y-auto">
          <h3 className="font-bold text-lg mb-3">SEO Checklist</h3>
          <div className="space-y-2">
            {checks.map((check) => (
              <div key={check.id} className="flex items-start gap-2">
                {check.status === "pass" && (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                )}
                {check.status === "warning" && (
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                )}
                {check.status === "fail" && (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-sm">{check.label}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {check.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SEOChecklist;
