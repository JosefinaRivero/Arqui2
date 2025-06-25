FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Limpiar cache e instalar dependencias
RUN npm cache clean --force
RUN npm install

# Copiar código fuente
COPY public/ public/
COPY src/ src/
COPY tailwind.config.js .
COPY postcss.config.js .

# Build de la aplicación
RUN npm run build

# Imagen de producción
FROM nginx:alpine

# Copiar archivos construidos
COPY --from=builder /app/build /usr/share/nginx/html

# Configuración de nginx
RUN echo 'server { \
    listen 3000; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /static { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]