import React from 'react';

const PageLogo: React.FC = () => {
  return (
    <div className="fixed top-4 right-4 z-50 page-logo-container">
      <img 
        src="/images/logos/fulllogo_transparent.png" 
        alt="React Fast Training" 
        className="h-20 md:h-30 lg:h-40 w-auto"
      />
    </div>
  );
};

export default PageLogo;