#!/bin/bash

# AWS Lightsail Deployment Script
# هذا السكريبت يساعدك في نشر المشروع على AWS Lightsail

echo "=========================================="
echo "  AWS Lightsail Deployment Helper"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if SSH key is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: SSH key path required${NC}"
    echo "Usage: ./deploy-to-lightsail.sh <path-to-ssh-key> <server-ip>"
    echo "Example: ./deploy-to-lightsail.sh ~/.ssh/lightsail-key.pem 15.185.xxx.xxx"
    exit 1
fi

if [ -z "$2" ]; then
    echo -e "${RED}❌ Error: Server IP required${NC}"
    echo "Usage: ./deploy-to-lightsail.sh <path-to-ssh-key> <server-ip>"
    echo "Example: ./deploy-to-lightsail.sh ~/.ssh/lightsail-key.pem 15.185.xxx.xxx"
    exit 1
fi

SSH_KEY=$1
SERVER_IP=$2
SERVER_USER="ubuntu"

echo -e "${YELLOW}📡 Connecting to server: $SERVER_IP${NC}"
echo ""

# Commands to run on server
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
    echo "=========================================="
    echo "  Updating Application"
    echo "=========================================="
    echo ""
    
    # Navigate to project directory
    cd /home/ubuntu/oliviaship-2025 || exit
    
    # Pull latest changes
    echo "📥 Pulling latest changes from GitHub..."
    git pull origin main
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    # Restart application
    echo "🔄 Restarting application..."
    pm2 restart oliviaship
    
    # Show status
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    pm2 status
    
    echo ""
    echo "📊 Recent logs:"
    pm2 logs oliviaship --lines 20 --nostream
ENDSSH

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "🔗 Check your API at: http://$SERVER_IP:5000/api/health"
echo ""
