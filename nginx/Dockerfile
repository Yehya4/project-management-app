FROM nginx:1.27-alpine

# Supprimer la config par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Copier notre config personnalisée
COPY nginx.conf /etc/nginx/nginx.conf

# Créer le dossier pour les logs
RUN mkdir -p /var/log/nginx

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
