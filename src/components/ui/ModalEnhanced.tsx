import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@utils/cn";
import FocusTrap from "@components/common/FocusTrap";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const ModalEnhanced: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, closeOnEscape]);

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <FocusTrap active={isOpen}>
              <motion.div
                ref={modalRef}
                className={cn(
                  "relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl",
                  "max-h-[90vh] overflow-hidden",
                  sizes[size],
                  className
                )}
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      {title && (
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {description}
                        </p>
                      )}
                    </div>
                    {showCloseButton && (
                      <motion.button
                        onClick={onClose}
                        className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <span className="sr-only">Close modal</span>
                      </motion.button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
                  <div className="p-6">
                    {children}
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-secondary-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
              </motion.div>
            </FocusTrap>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Drawer variant of modal
export const Drawer: React.FC<
  ModalProps & {
    position?: "left" | "right" | "top" | "bottom";
  }
> = ({ position = "right", ...props }) => {
  const drawerVariants = {
    hidden: {
      ...(position === "left" && { x: "-100%" }),
      ...(position === "right" && { x: "100%" }),
      ...(position === "top" && { y: "-100%" }),
      ...(position === "bottom" && { y: "100%" }),
    },
    visible: {
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300,
      },
    },
    exit: {
      ...(position === "left" && { x: "-100%" }),
      ...(position === "right" && { x: "100%" }),
      ...(position === "top" && { y: "-100%" }),
      ...(position === "bottom" && { y: "100%" }),
      transition: {
        duration: 0.3,
      },
    },
  };

  const positionClasses = {
    left: "left-0 top-0 h-full max-w-md",
    right: "right-0 top-0 h-full max-w-md",
    top: "top-0 left-0 w-full max-h-96",
    bottom: "bottom-0 left-0 w-full max-h-96",
  };

  return (
    <AnimatePresence>
      {props.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={props.closeOnOverlayClick ? props.onClose : undefined}
          />

          {/* Drawer */}
          <motion.div
            className={cn(
              "fixed bg-white dark:bg-gray-800 shadow-2xl z-50",
              positionClasses[position],
              props.className
            )}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="h-full overflow-y-auto">
              {props.title && (
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold">{props.title}</h2>
                  {props.showCloseButton && (
                    <motion.button
                      onClick={props.onClose}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
              )}
              <div className="p-6">{props.children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ModalEnhanced;