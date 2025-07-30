import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@utils/cn";
import { useKeyboardNavigation } from "@hooks/useAccessibility";

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className,
}) => {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);
  const itemRefs = useRef<HTMLButtonElement[]>([]);
  const { handleKeyDown } = useKeyboardNavigation({
    current: itemRefs.current,
  } as React.RefObject<HTMLElement[]>);

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      );
    } else {
      setOpenItems((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  const isOpen = (id: string) => openItems.includes(id);

  return (
    <div
      className={cn("space-y-2", className)}
      role="region"
      aria-label="Accordion"
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          <button
            ref={(el) => {
              if (el) itemRefs.current[index] = el;
            }}
            onClick={() => toggleItem(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset"
            aria-expanded={isOpen(item.id)}
            aria-controls={`accordion-content-${item.id}`}
            id={`accordion-trigger-${item.id}`}
          >
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              {item.title}
            </span>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-gray-500 transition-transform duration-200 flex-shrink-0",
                isOpen(item.id) && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>

          <AnimatePresence initial={false}>
            {isOpen(item.id) && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div
                  id={`accordion-content-${item.id}`}
                  role="region"
                  aria-labelledby={`accordion-trigger-${item.id}`}
                  className="px-6 pb-4 text-gray-600 dark:text-gray-400"
                >
                  {item.content}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default Accordion;
