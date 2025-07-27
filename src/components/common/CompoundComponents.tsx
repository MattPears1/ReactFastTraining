import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { cn } from '@utils/cn';

// Card Compound Component Pattern
interface CardContextValue {
  variant?: 'default' | 'elevated' | 'outlined';
  isHoverable?: boolean;
  isClickable?: boolean;
}

const CardContext = createContext<CardContextValue | undefined>(undefined);

const useCardContext = () => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('Card compound components must be used within a Card');
  }
  return context;
};

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  hoverable?: boolean;
  clickable?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Card = ({ 
  children, 
  variant = 'default', 
  hoverable = false,
  clickable = false,
  className,
  onClick 
}: CardProps) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg overflow-hidden';
  
  const variantClasses = {
    default: 'border border-gray-200 dark:border-gray-700',
    elevated: 'shadow-lg',
    outlined: 'border-2 border-gray-300 dark:border-gray-600',
  };

  const interactiveClasses = cn(
    hoverable && 'transition-transform hover:scale-[1.02]',
    clickable && 'cursor-pointer'
  );

  return (
    <CardContext.Provider value={{ variant, isHoverable: hoverable, isClickable: clickable }}>
      <div 
        className={cn(baseClasses, variantClasses[variant], interactiveClasses, className)}
        onClick={onClick}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
      >
        {children}
      </div>
    </CardContext.Provider>
  );
};

Card.Header = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { variant } = useCardContext();
  const borderClass = variant !== 'elevated' ? 'border-b border-gray-200 dark:border-gray-700' : '';
  
  return (
    <div className={cn('px-6 py-4', borderClass, className)}>
      {children}
    </div>
  );
};

Card.Body = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('px-6 py-4', className)}>
    {children}
  </div>
);

Card.Footer = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { variant } = useCardContext();
  const borderClass = variant !== 'elevated' ? 'border-t border-gray-200 dark:border-gray-700' : '';
  
  return (
    <div className={cn('px-6 py-4', borderClass, className)}>
      {children}
    </div>
  );
};

// Modal Compound Component Pattern
interface ModalContextValue {
  isOpen: boolean;
  onClose: () => void;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal compound components must be used within a Modal');
  }
  return context;
};

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export const Modal = ({ 
  children, 
  isOpen, 
  onClose,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true
}: ModalProps) => {
  React.useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  return (
    <ModalContext.Provider value={{ isOpen, onClose, size }}>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />
        <div className={cn('relative w-full', sizeClasses[size])}>
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  );
};

Modal.Content = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn(
    'bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden',
    'transform transition-all',
    className
  )}>
    {children}
  </div>
);

Modal.Header = ({ 
  children, 
  className,
  showCloseButton = true 
}: { 
  children: ReactNode; 
  className?: string;
  showCloseButton?: boolean;
}) => {
  const { onClose } = useModalContext();
  
  return (
    <div className={cn(
      'px-6 py-4 border-b border-gray-200 dark:border-gray-700',
      'flex items-center justify-between',
      className
    )}>
      <div className="flex-1">{children}</div>
      {showCloseButton && (
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

Modal.Body = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('px-6 py-4', className)}>
    {children}
  </div>
);

Modal.Footer = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn(
    'px-6 py-4 border-t border-gray-200 dark:border-gray-700',
    'flex items-center justify-end gap-3',
    className
  )}>
    {children}
  </div>
);

// Tabs Compound Component Pattern
interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  tabs: Tab[];
  variant: 'default' | 'pills' | 'underline';
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be used within a Tabs');
  }
  return context;
};

interface TabsProps {
  children: ReactNode;
  defaultTab?: string;
  tabs: Tab[];
  variant?: 'default' | 'pills' | 'underline';
  onChange?: (tabId: string) => void;
}

export const Tabs = ({ 
  children, 
  defaultTab,
  tabs,
  variant = 'default',
  onChange
}: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const handleTabChange = useCallback((id: string) => {
    setActiveTab(id);
    onChange?.(id);
  }, [onChange]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange, tabs, variant }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
};

Tabs.List = ({ className }: { className?: string }) => {
  const { tabs, activeTab, setActiveTab, variant } = useTabsContext();

  const baseClasses = 'flex';
  
  const variantClasses = {
    default: 'border-b border-gray-200 dark:border-gray-700',
    pills: 'gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg',
    underline: 'gap-6 border-b-2 border-gray-200 dark:border-gray-700',
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        
        const tabClasses = {
          default: cn(
            'px-4 py-2 font-medium text-sm transition-colors',
            'border-b-2 -mb-px',
            isActive
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200',
            tab.disabled && 'opacity-50 cursor-not-allowed'
          ),
          pills: cn(
            'px-4 py-2 font-medium text-sm rounded-md transition-all',
            isActive
              ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
            tab.disabled && 'opacity-50 cursor-not-allowed'
          ),
          underline: cn(
            'px-1 py-2 font-medium text-sm transition-colors relative',
            'border-b-2 -mb-0.5',
            isActive
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200',
            tab.disabled && 'opacity-50 cursor-not-allowed'
          ),
        };

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            className={tabClasses[variant]}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

Tabs.Panels = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { activeTab } = useTabsContext();
  
  return (
    <div className={cn('mt-4', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.props.id === activeTab) {
          return child;
        }
        return null;
      })}
    </div>
  );
};

Tabs.Panel = ({ 
  children, 
  id,
  className 
}: { 
  children: ReactNode; 
  id: string;
  className?: string;
}) => {
  const { activeTab } = useTabsContext();
  
  if (id !== activeTab) return null;
  
  return (
    <div
      id={`tabpanel-${id}`}
      role="tabpanel"
      className={cn('animate-fadeIn', className)}
    >
      {children}
    </div>
  );
};