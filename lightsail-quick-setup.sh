#!/bin/bash

# ========================================
# AWS Lightsail Quick Setup Script
# سكريبت الإعداد السريع لـ AWS Lightsail
# ========================================

echo "=========================================="
echo "  AWS Lightsail Quick Setup"
echo "  إعداد سريع لـ AWS Lightsail"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ========================================
# Step 1: Update System
# ========================================
echo -e "${YELLOW}[1/7] Updating system...${NC}"
sudo apt update && sudo apt upgrade -y
echo -e "${GREEN}✅ System updated${NC}"
echo ""

# ========================================
# Step 2: Install Node.js 20
# ========================================
echo -e "${YELLOW}[2/7] Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
echo -e "${GREEN}✅ Node.js installed: $(node --version)${NC}"
echo -e "${GREEN}✅ npm installed: $(npm --version)${NC}"
echo ""

# ========================================
# Step 3: Install PM2
# ========================================
echo -e "${YELLOW}[3/7] Installing PM2...${NC}"
sudo npm install -g pm2
echo -e "${GREEN}✅ PM2 installed${NC}"
echo ""

# ========================================
# Step 4: Install Git
# ========================================
echo -e "${YELLOW}[4/7] Installing Git...${NC}"
sudo apt install -y git
echo -e "${GREEN}✅ Git installed: $(git --version)${NC}"
echo ""

# ========================================
# Step 5: Clone Project
# ========================================
echo -e "${YELLOW}[5/7] Cloning project...${NC}"
cd /home/ubuntu
if [ -d "oliviaship-2025" ]; then
    echo -e "${YELLOW}⚠️  Project directory exists, pulling latest changes...${NC}"
    cd oliviaship-2025
    git pull origin main
else
    git clone https://github.com/info-makerhgj/oliviaship-2025.git
    cd oliviaship-2025
fi
echo -e "${GREEN}✅ Project cloned${NC}"
echo ""

# ========================================
# Step 6: Install Dependencies
# ========================================
echo -e "${YELLOW}[6/7] Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# ========================================
# Step 7: Setup .env file
# ========================================
echo -e "${YELLOW}[7/7] Setting up .env file...${NC}"
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
else
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}📝 Please create .env file manually:${NC}"
    echo ""
    echo "nano .env"
    echo ""
    echo -e "${YELLOW}Then copy the content from .env.lightsail.example${NC}"
fi
echo ""

# ========================================
# Summary
# ========================================
echo "=========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Create .env file: nano .env"
echo "2. Add MongoDB connection string"
echo "3. Start application: pm2 start server/index.js --name oliviaship"
echo "4. Save PM2: pm2 save"
echo "5. Setup startup: pm2 startup"
echo ""
echo -e "${GREEN}Good luck! 🚀${NC}"
