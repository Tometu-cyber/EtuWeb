self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('fetch', event => {
  // Mode pass-through, tu peux améliorer pour le offline
});