if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
    .then(reg => console.log('Service worker enregistré', reg))
    .catch(err => console.error('Erreur SW', err));
}