FROM node:22-alpine

# Installer wget pour les healthchecks Docker
RUN apk add --no-cache wget

WORKDIR /app

# Copier les dépendances en premier (cache Docker optimisé)
COPY package*.json ./
RUN npm ci --omit=dev

# Copier le code source
COPY . .

# Créer le dossier logs avec les bonnes permissions
RUN mkdir -p logs && chgrp -R 0 /app && chmod -R g=u /app

EXPOSE 5000

# Health check intégré
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Lancer en tant qu'utilisateur non-root (sécurité)
USER 1001

CMD ["node", "src/index.js"]