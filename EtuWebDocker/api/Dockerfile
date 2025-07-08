# Dockerfile pour l'API Express
FROM node:18-alpine

# Créer le répertoire de l'application
WORKDIR /app

# Installer python3 et py3-pip
RUN apk add --no-cache python3 py3-pip
RUN pip3 install PyPDF4 --break-system-packages

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Créer le répertoire de l'application
WORKDIR /app/EtuReadPdf/json
WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Changer le propriétaire des fichiers
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Exposer le port 3000
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
