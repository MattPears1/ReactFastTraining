// Clear admin tokens script
console.log('🧹 Clearing all admin tokens...');
localStorage.removeItem('adminAccessToken');
localStorage.removeItem('adminRefreshToken');
localStorage.removeItem('adminUser');
sessionStorage.removeItem('adminAccessToken');
sessionStorage.removeItem('adminRefreshToken');
sessionStorage.removeItem('adminUser');
console.log('✅ All admin tokens cleared');
console.log('Please refresh the page to apply changes');