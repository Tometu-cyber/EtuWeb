const toggle = document.getElementById('dark-toggle');
const html = document.documentElement;

// Appliquer le mode sombre si déjà activé
if (localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
html.classList.add('dark');
}

toggle?.addEventListener('click', () => {
html.classList.toggle('dark');
if (html.classList.contains('dark')) {
    localStorage.setItem('theme', 'dark');
} else {
    localStorage.setItem('theme', 'light');
}
});