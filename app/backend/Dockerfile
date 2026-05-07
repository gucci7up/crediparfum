FROM php:8.2-apache

# Habilitar mod_rewrite de Apache (útil si luego se usa un enrutador)
RUN a2enmod rewrite

# Instalar dependencias necesarias para las extensiones de PHP
RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    && rm -rf /var/lib/apt/lists/*

# Instalar y habilitar las extensiones PDO y MySQL
RUN docker-php-ext-install pdo pdo_mysql zip

# Copiar el código fuente del backend al directorio raíz del servidor web
COPY . /var/www/html/

# Configurar los permisos adecuados
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Exponer el puerto 80
EXPOSE 80

# El comando CMD por defecto de la imagen php:8.2-apache iniciará Apache en primer plano
