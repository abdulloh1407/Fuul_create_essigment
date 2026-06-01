# CI/CD Konfiguratsiyasi

Bu dokument CRM sistemasi uchun GitHub Actions CI/CD pipelineini sozlash bo'yicha qo'llanmadir.

## Ishchi Workflowlar

### 1. **deploy.yml** - Asosiy CI/CD Pipeline
- ✅ Build va test qadami (har qanday push/PR)
- 🐳 Docker image yaratish va push qilish (main va develop branchlari)
- 🚀 EC2 ga deployment (faqat main branch)

### 2. **lint-and-test.yml** - Kod Sifatini Tekshirish
- 🔍 ESLint bilan kod analizi
- 📐 Prettier bilan format tekshirish
- 🧪 Unit testlar (agar mavjud bo'lsa)
- 🗄️ PostgreSQL test bazasi bilan integration testlar

### 3. **security.yml** - Xavfsizlik Tekshiruvi
- 🛡️ NPM audit bilan dependency tekshirish
- 🔐 CodeQL bilan kod sifatini tahlil qilish
- 📅 Haftada bir marta avtomatik ishga tushirish

## GitHub Secrets Sozlamalari

Quyidagi secretlarni GitHub repository sozlamalarida o'rnatish kerak:

### 1. **EC2 Deployment Secretlari**
Repository → Settings → Secrets → New repository secret

```
EC2_HOST          = EC2 instansiy IP address yoki domain
EC2_USERNAME      = SSH foydalanuvchi nomi (odatda: ubuntu)
EC2_PRIVATE_KEY   = EC2 SSH private key (PEM format)
```

**SSH Private Key Olish:**
```bash
# Agar allaqachon EC2 key pair yaratilgan bo'lsa:
cat ~/.ssh/your-key.pem
# Butun kontentni GitHub Secrets-ga qo'shimchali bo'lmasligi sababli ko'chirish
```

### 2. **Docker Registry Secretlari** (Ixtiyoriy)
```
DOCKER_USERNAME   = Docker Hub foydalanuvchi nomi
DOCKER_PASSWORD   = Docker Hub access token
```

### 3. **.env Fayli EC2 da**
EC2 serveri o'rnatishda quyidagi `.env` faylini yaratish kerak:

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# EC2 da:
cd /home/ubuntu/crm-system
cat > .env << EOF
PORT=3000
DB_USER=postgres
DB_HOST=db
DB_NAME=crm_db
DB_PASSWORD=adminpassword
DB_PORT=5432
NODE_ENV=production
EOF
```

## GitHub Actions Secrets O'rnatish

1. Repository ochish
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** bosingiz
4. Quyidagi secretlarni qo'shimchali qiling:

### Misol: EC2_PRIVATE_KEY Qo'shimchi Qilish

```
Name: EC2_PRIVATE_KEY
Secret: (PEM faylining butun matni)
```

## Push Ichida Ishga Tushish

### `main` Branchga Push:
```bash
git push origin main
```
**Natijon:**
1. Lint va testlar ishga tushadi
2. Docker image build qilinadi va push qilinadi
3. EC2 serveri avtomatik deploy qilinadi

### `develop` Branchga Push:
```bash
git push origin develop
```
**Natijon:**
1. Lint va testlar ishga tushadi
2. Docker image build qilinadi va push qilinadi
3. ❌ Deploy qilinmaydi (faqat `main` uchun)

### Pull Request:
```bash
git push origin feature/your-feature
# GitHub da PR ochish
```
**Natijon:**
1. ✅ Lint va testlar ishga tushadi
2. ❌ Docker push va deploy qilinmaydi

## Workflow Status Tekshirish

GitHub Actions status tekshirish uchun:

1. Repository ochish → **Actions** tab
2. Barcha ishchi workflowlarni ko'rish
3. Har bir workflow uchun:
   - ✅ Success (Yashil)
   - ❌ Failed (Qizil)
   - ⏳ In progress (Sariq)

## EC2 da Deployment Tekshirish

Deployment muvaffaqiyatli bo'lgani tekshirish uchun:

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Containerlarni ko'rish
docker-compose ps

# Loglarni ko'rish
docker-compose logs -f web

# Serverni test qilish
curl http://localhost:3000
```

## Xatolikni Tuzatish

### 1. Deploy Failed Bo'lsa
```bash
# GitHub Actions loglarini tekshirish
# Actions → Latest workflow → deploy job → logs

# EC2 da manual tekshirish:
ssh -i your-key.pem ubuntu@your-ec2-ip
cd /home/ubuntu/crm-system
docker-compose logs
```

### 2. Docker Build Failed Bo'lsa
- `package.json` ni tekshirish
- `Dockerfile` o'rnatishlarini tekshirish
- `npm install` xatoliklarini ko'rish

### 3. SSH Connection Failed Bo'lsa
- EC2_HOST to'g'ri ekanligini tekshirish
- SSH key fayli to'g'ri ekanligini tekshirish
- EC2 security groupida 22-port ochiq ekanligini tekshirish

## Best Practices

1. ✅ Har doim `main` branchga push-dan oldin PR yaratish
2. ✅ CI/CD testlar o'tmaguncha merge qilmasligi
3. ✅ Sensitive ma'lumotlarni `.env` faylida saqlash
4. ✅ Regular basis'da dependency-larni yangilash (`npm audit`)
5. ✅ Docker image'ni local'da test qilish deploy-dan oldin

## Qo'shimcha Resurslar

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Hub Registry](https://hub.docker.com)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
