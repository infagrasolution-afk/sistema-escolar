#!/usr/bin/env bash
# =============================================================================
# SCRIPT DE DESPLIEGUE AUTOMATIZADO PARA VPS HOSTINGER (DOCKER + GIT + CERTBOT)
# =============================================================================

set -e

echo "🚀 Iniciando proceso de despliegue del Sistema Escolar en VPS Hostinger..."

# 1. Verificar actualización de paquetes y dependencias del sistema
echo "📦 Actualizando repositorios del sistema..."
sudo apt-get update -y
sudo apt-get install -y git curl docker.io docker-compose-plugin certbot

# 2. Habilitar e iniciar servicio Docker
echo "🐳 Configurando servicio Docker..."
sudo systemctl enable docker
sudo systemctl start docker

# 3. Clonar o actualizar repositorio Git
REPO_DIR="/var/www/generador-qr-barras"
if [ ! -d "$REPO_DIR" ]; then
    echo "📥 Clonando repositorio Git..."
    sudo git clone https://github.com/usuario/generador-qr-barras.git "$REPO_DIR"
    cd "$REPO_DIR"
else
    echo "🔄 Actualizando código fuente desde Git..."
    cd "$REPO_DIR"
    sudo git pull origin main
fi

# 4. Configurar variables de entorno (.env)
if [ ! -f ".env" ]; then
    echo "📝 Generando archivo de variables de entorno (.env)..."
    sudo cp .env.example .env
    echo "⚠️ Por favor, edite .env con su SECRET_KEY y contraseñas de producción."
fi

# 5. Construir y levantar contenedores con Docker Compose
echo "🏗️ Construyendo imágenes y levantando contenedores con Docker Compose..."
sudo docker compose down --remove-orphans || true
sudo docker compose up -d --build

# 6. Emisión e instalación de certificado SSL con Certbot (Let's Encrypt)
read -p "🌐 Ingrese su nombre de dominio (Ej: colegio.midominio.com): " DOMAIN
read -p "📧 Ingrese su correo electrónico para Certbot SSL: " EMAIL

if [ -n "$DOMAIN" ] && [ -n "$EMAIL" ]; then
    echo "🔒 Solicitando certificado SSL Certbot para $DOMAIN..."
    sudo certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive || true
    echo "✅ Certificado SSL configurado."
fi

echo "============================================================================="
echo "🎉 DESPLIEGUE COMPLETADO EXITOSAMENTE"
echo "============================================================================="
echo " Backend FastAPI: http://localhost:8000/docs"
echo " Frontend React:   http://localhost/"
echo " Proxy Nginx:      Servicio activo en puertos 80/443"
echo "============================================================================="
