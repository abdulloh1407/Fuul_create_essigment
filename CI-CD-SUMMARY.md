# 📊 CI/CD Setup - To'liq Xulosa

CRM sistemasiga uchun professional-darajali CI/CD pipeline o'rnatildi. Quyida barcha tafsilotlar mavjud.

## 📁 Yaratilgan Fayllar

### GitHub Actions Workflows (`.github/workflows/`)

```
✅ deploy.yml           → Asosiy CI/CD pipeline (build, test, docker, deploy)
✅ lint-and-test.yml    → Kod sifatini tekshirish va testlar
✅ security.yml         → Security audit va CodeQL analizi
✅ health-check.yml     → 30 minutda bir deployment health check
✅ rollback.yml         → Deployment qayta tiklanish uchun
```

### Documentation Fayllar

```
✅ CI-CD-SETUP.md       → Batafsil konfiguratsiya qo'llanmasi
✅ QUICK-SETUP.md       → Tez sozlash uchun qo'llanma
✅ CI-CD-SUMMARY.md     → Ushbu xulosa (faylda mavjud)
```

### Test va Helper Skriptlari

```
✅ test-ci-cd.sh        → Local CI/CD test (Linux/Mac)
✅ test-ci-cd.bat       → Local CI/CD test (Windows)
```

## 🔄 Pipeline Ishchi Tartib

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPER PUSH TO GIT                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 GITHUB ACTIONS TRIGGER                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────┐
    │  PARALLEL JOBS:                                     │
    ├─────────────────────────────────────────────────────┤
    │  📌 BUILD JOB                                       │
    │     • Node.js o'rnatish                             │
    │     • npm ci (dependencies)                         │
    │     • ESLint (kod tekshirish)                       │
    │     • Unit tests                                    │
    │                                                     │
    │  🔒 SECURITY JOB                                    │
    │     • npm audit                                     │
    │     • CodeQL analizi                                │
    │                                                     │
    │  🐳 LINT & TEST JOB                                 │
    │     • Prettier format check                         │
    │     • Prettier test (PostgreSQL)                    │
    └─────────────────────────────────────────────────────┘
                              ↓
         (Build muvaffaqiyatli bo'lganidan keyin)
                              ↓
    ┌─────────────────────────────────────────────────────┐
    │  DOCKER IMAGE BUILD & PUSH                          │
    │     • Docker image yaratish                         │
    │     • GitHub Container Registry-ga push            │
    │     • Tags: branch, commit hash, version           │
    └─────────────────────────────────────────────────────┘
                              ↓
         (faqat 'main' branchga push bo'lsa)
                              ↓
    ┌─────────────────────────────────────────────────────┐
    │  EC2 DEPLOYMENT                                     │
    │     • SSH orqali EC2 ga ulash                       │
    │     • Kodni yangilash (git pull)                    │
    │     • Docker compose down                          │
    │     • Docker compose up --build                    │
    │     • Deployment logs                              │
    └─────────────────────────────────────────────────────┘
                              ↓
         (30 minutda bir avtomat)
                              ↓
    ┌─────────────────────────────────────────────────────┐
    │  HEALTH CHECK                                       │
    │     • Container status tekshirish                   │
    │     • HTTP 200 tekshirish                           │
    │     • Database connection tekshirish                │
    └─────────────────────────────────────────────────────┘
                              ↓
                    ✨ DEPLOYMENT COMPLETE ✨
```

## 🎯 Features

### ✅ Avtomatik Tekshiruvlar
- **Linting**: ESLint-da kod tekshirish
- **Formatting**: Prettier-da code style tekshirish
- **Testing**: Unit testlar (agar mavjud bo'lsa)
- **Security**: npm audit va CodeQL

### ✅ Docker Integratsiyasi
- Avtomatik Docker image build
- GitHub Container Registry-ga push
- Semantik tagging (branch, commit, version)

### ✅ Smart Deployment
- Faqat `main` branchdan EC2 ga deployment
- `develop` branchda Docker image build lekin deploy yo'q
- Pull Request-larda deployment yo'q

### ✅ Monitoring va Health Checks
- 30 minutda bir automatic health check
- Container status monitoring
- HTTP endpoint tekshirish
- Database connection tekshirish

### ✅ Rollback Capability
- Manual rollback workflow
- Previous commit-ga qaytarish imkoniyati
- Health check-dan keyin validation

## 🔐 Zarur GitHub Secrets

```
EC2_HOST           = EC2 IP address yoki domain
EC2_USERNAME       = SSH foydalanuvchi nomi (ubuntu)
EC2_PRIVATE_KEY    = SSH private key (PEM format)
```

## 📋 Branch Strategy

### `main` branch
```
✅ Linting va Testing
✅ Docker Image Build
✅ EC2 Deployment
✅ Health Check
```

### `develop` branch
```
✅ Linting va Testing
✅ Docker Image Build
❌ EC2 Deployment (SKIP)
```

### Feature Branches
```
✅ Linting va Testing
❌ Docker Image Build (SKIP)
```

## 🚀 Qo'llanma

### 1. GitHub Secrets O'rnatish
```bash
# Repository Settings → Secrets and variables → Actions
# Quyidagi secretlarni qo'shimchali qiling:
- EC2_HOST
- EC2_USERNAME
- EC2_PRIVATE_KEY
```

### 2. EC2 Tayyorlash
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# .env fayli yaratish
cat > /home/ubuntu/crm-system/.env << EOF
PORT=3000
DB_USER=postgres
DB_HOST=db
DB_NAME=crm_db
DB_PASSWORD=adminpassword
DB_PORT=5432
NODE_ENV=production
EOF
```

### 3. Deploy Qilish
```bash
git add .
git commit -m "Feature: New feature"
git push origin main
```

### 4. Local Test
```bash
# Linux/Mac
./test-ci-cd.sh

# Windows
test-ci-cd.bat
```

## 📊 Monitoring va Debugging

### GitHub Actions Logs
1. Repository → Actions tab
2. Workflow-ni tanlang
3. Run details-ni ko'rish

### EC2 Logs
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
cd /home/ubuntu/crm-system

# Barcha logs
docker-compose logs

# Faqat web container
docker-compose logs web

# Real-time logs
docker-compose logs -f web

# Database logs
docker-compose logs db
```

### Health Check
```bash
# Test deployment
curl http://your-ec2-ip:3000

# Container status
docker-compose ps

# Network check
docker network ls
```

## 🔧 Customization

### Test Qo'shimchali Qilish
`package.json` da test skripti qo'shimchali qiling:
```json
{
  "scripts": {
    "test": "jest --coverage"
  }
}
```

### Lint Qo'shimchali Qilish
`.eslintrc.json` yaratish:
```json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": "eslint:recommended"
}
```

## ⚙️ Environment Configuration

### Local (.env)
```
PORT=3000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=adminpassword
DB_NAME=crm_db
NODE_ENV=development
```

### Production (EC2 .env)
```
PORT=3000
DB_HOST=db
DB_USER=postgres
DB_PASSWORD=adminpassword
DB_NAME=crm_db
NODE_ENV=production
```

## 📈 Performance Tips

1. **Cache**: npm cache o'rnatilgan (faster installs)
2. **Parallel**: Jobs parallel ishga tushadi
3. **Conditional**: Deploy faqat `main` branchga
4. **Health**: Regular health checks

## 🛠️ Troubleshooting

| Muammo | Yechim |
|---|---|
| Deploy failed | GitHub Actions logs → EC2 logs tekshirish |
| SSH connection error | EC2 IP, security group, SSH key tekshirish |
| Docker build failed | package.json, Dockerfile tekshirish |
| Health check failed | Container logs, port 3000 tekshirish |
| Database connection error | .env fayli, docker-compose logs |

## 📚 Qo'shimcha Resurslar

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Docs](https://docs.docker.com)
- [Docker Compose Docs](https://docs.docker.com/compose)
- [Express.js Docs](https://expressjs.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

## ✅ Checklist

- [ ] GitHub Secrets o'rnatildi
- [ ] EC2 instance tayyor
- [ ] `.env` fayli EC2 da yaratildi
- [ ] Docker va Docker Compose o'rnatilgan
- [ ] SSH key to'g'ri konfiguratsiya qilindi
- [ ] Local test o'tdi
- [ ] Birinchi deployment muvaffaqiyatli bo'ldi

---

**Setup Tugallandi!** ✨ Endi har bir push `main` branchga avtomatik CI/CD ishga tushadi.
