// Run this in browser console to unregister service worker in development
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister().then(function(success) {
        console.log('Service Worker unregistered:', success);
      });
    }
  });
}
