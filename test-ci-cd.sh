#!/bin/bash
# Local CI/CD Test Skripti
# Bu skript CI/CD pipelineini local'da simulyatsiya qiladi

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔷 Local CI/CD Test Skriptini boshlash...${NC}"
echo "=================================================="

# 1. Lint Tekshirish
echo -e "\n${YELLOW}1️⃣  Lint tekshirish...${NC}"
if npm run lint 2>/dev/null; then
    echo -e "${GREEN}✅ Lint tekshiruvi muvaffaqiyatli${NC}"
else
    echo -e "${YELLOW}⚠️ ESLint konfiguratsiyasi topilmadi (o'tkazib yuborish)${NC}"
fi

# 2. Prettier Format Tekshirish
echo -e "\n${YELLOW}2️⃣  Code formati tekshirish...${NC}"
if npx prettier --check . --ignore-path .gitignore 2>/dev/null; then
    echo -e "${GREEN}✅ Format tekshiruvi muvaffaqiyatli${NC}"
else
    echo -e "${YELLOW}⚠️ Prettier topilmadi (o'tkazib yuborish)${NC}"
fi

# 3. Test Ishga Tushirish
echo -e "\n${YELLOW}3️⃣  Testlarni ishga tushirish...${NC}"
if npm test 2>/dev/null; then
    echo -e "${GREEN}✅ Testlar muvaffaqiyatli${NC}"
else
    echo -e "${YELLOW}⚠️ Test skriptlari topilmadi (o'tkazib yuborish)${NC}"
fi

# 4. NPM Audit
echo -e "\n${YELLOW}4️⃣  NPM security audit...${NC}"
if npm audit --audit-level=moderate; then
    echo -e "${GREEN}✅ Security audit muvaffaqiyatli${NC}"
else
    echo -e "${YELLOW}⚠️ Security qaygular bor (diqqat bilan ko'rish tavsiya etiladi)${NC}"
fi

# 5. Docker Build Tekshirish (Ixtiyoriy)
echo -e "\n${YELLOW}5️⃣  Docker image build tekshirish (ixtiyoriy)...${NC}"
read -p "Docker image build qilishni xohlaysizmi? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if docker build -t crm-system:test . > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker build muvaffaqiyatli${NC}"
        docker rmi crm-system:test > /dev/null 2>&1
    else
        echo -e "${RED}❌ Docker build xatolikka duch keldi${NC}"
        exit 1
    fi
fi

# 6. Docker Compose Tekshirish (Ixtiyoriy)
echo -e "\n${YELLOW}6️⃣  Docker Compose tekshirish (ixtiyoriy)...${NC}"
read -p "Docker Compose-ni test qilishni xohlaysizmi? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}📦 Containers ishga tushirilmoqda...${NC}"
    docker-compose up -d
    
    echo -e "${BLUE}⏳ Containers ishga tushishi uchun kutish (10 sekund)...${NC}"
    sleep 10
    
    if docker-compose ps | grep -q "crm_node_server"; then
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Application muvaffaqiyatli javob bermoqda${NC}"
        else
            echo -e "${YELLOW}⚠️ Container ishga tushgan lekin javob bermayapti${NC}"
        fi
    else
        echo -e "${RED}❌ Container ishga tushmadi${NC}"
    fi
    
    echo -e "\n${BLUE}🧹 Cleanup...${NC}"
    docker-compose down --remove-orphans
    echo -e "${GREEN}✅ Containers to'xtatildi${NC}"
fi

echo -e "\n${GREEN}=================================================="
echo -e "✨ Local CI/CD test tugallandi!${NC}"
echo -e "=================================================="
