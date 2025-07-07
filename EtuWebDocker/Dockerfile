# Dockerfile pour EtuWeb - Site web statique
FROM nginx:alpine

# Créer l'utilisateur nodeuser sans droits root
RUN adduser -D -g '' nodeuser

# Supprimer la configuration par défaut de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copier tous les fichiers du projet dans le répertoire web de Nginx
COPY EtuWebProd/ /usr/share/nginx/html/

# Donner les droits à nodeuser sur le dossier HTML
RUN chown -R nodeuser:nodeuser /usr/share/nginx/html

# Configuration Nginx personnalisée (optionnelle)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Nginx se lance automatiquement avec l'image
CMD ["nginx", "-g", "daemon off;"]
