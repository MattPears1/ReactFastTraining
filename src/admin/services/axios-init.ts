// Axios initialization to ensure it's available before services load
import axios from 'axios';

// Make axios available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).axios = axios;
  console.log('[Axios Init] Axios loaded and made available');
}

// Export axios to ensure it's bundled
export { axios };
export default axios;