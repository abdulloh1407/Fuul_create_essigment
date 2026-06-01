# 🚀 CI/CD Tez Sozlash

Bu fayl GitHub Actions-ga zarur secretlarni o'rnatish uchun qo'llanmadir.

## 1️⃣ EC2 Instance Tayyorlash

```bash
# EC2 ga kirish
ssh -i your-key.pem ubuntu@your-ec2-ip

# Kerakli paketlarni o'rnatish
sudo apt update
sudo apt install -y docker.io docker-compose git

# Loyiha papkasini yaratish
mkdir -p /home/ubuntu/crm-system
cd /home/ubuntu/crm-system

# Foydalanuvchini docker guruhiga qo'shimchali qilish
sudo usermod -aG docker ubuntu
```

## 2️⃣ Environment Setup

EC2 da `.env` fayli yaratish:

```bash
cd /home/ubuntu/crm-system

cat > .env << 'EOF'
PORT=3000
DB_USER=postgres
DB_HOST=db
DB_NAME=crm_db
DB_PASSWORD=adminpassword
DB_PORT=5432
NODE_ENV=production
EOF

# Faylning ruxsatlarini o'zgartirish
chmod 600 .env
```

## 3️⃣ GitHub Secrets O'rnatish

GitHub Repository → Settings → Secrets and variables → Actions

### Quyidagi secretlarni qo'shimchali qiling:

| Secret Name | Qiymati | Izoh |
|---|---|---|
| `EC2_HOST` | `192.168.1.1` | EC2 public IP yoki domain |
| `EC2_USERNAME` | `ubuntu` | SSH foydalanuvchi nomi |
| `EC2_PRIVATE_KEY` | PEM key matni | SSH private key fayli |

### Kalitni olish:

```bash
# Local kompyuteringizda (Unix/Linux/Mac):
cat ~/.ssh/ec2-key.pem

# Windows PowerShell:
Get-Content C:\Users\YourName\.ssh\ec2-key.pem
```

## 4️⃣ Git Ignore Sozlamalari

`.gitignore` fayliga qo'shimchali qiling (agar yo'q bo'lsa):

```
# Environment o'zgaruvchilari
.env
.env.local

# Node modules
node_modules/

# Logs
*.log
npm-debug.log*

# Docker
.docker/
```

## 5️⃣ Workflow Status Badge (Ixtiyoriy)

README.md ga qo'shimchali qiling:

```markdown
## CI/CD Status

![Deploy Status](https://github.com/YOUR_USERNAME/crm-system/workflows/CI%2FCD%20Pipeline/badge.svg?branch=main)
![Lint Status](https://github.com/YOUR_USERNAME/crm-system/workflows/Lint%20va%20Test/badge.svg?branch=main)
![Security Status](https://github.com/YOUR_USERNAME/crm-system/workflows/Security%20Tekshiruvi/badge.svg?branch=main)
```

## 6️⃣ Birinchi Deploy-ni Tekshirish

1. GitHub Actions → Workflows → CI/CD Pipeline
2. "Run workflow" tugmasini bosing
3. main branchni tanlang
4. Workflow-ni kuzating

## 7️⃣ Jartarang Tekshiruvi

```bash
# Main branchga test commit push qiling
git checkout main
echo "test" >> test.txt
git add test.txt
git commit -m "Test commit"
git push origin main

# GitHub Actions-da workflow ishga tushganini tekshirish
```

## 🆘 Xatolik Tuzatish

### Deploy muvaffaqiyatsiz bo'lsa:

1. GitHub Actions loglarini o'qing
2. EC2 da manual tekshirish:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
cd /home/ubuntu/crm-system
docker-compose logs -f
```

### SSH connection failed:

- EC2 IP addressni tekshirish
- Security Group-da SSH port (22) ochiq ekanligini tekshirish
- SSH key ruxsatlarini tekshirish:
```bash
chmod 600 ~/.ssh/ec2-key.pem
```

## 📋 Deployment Qadamlari

```
Push to main
    ↓
GitHub Actions trigger
    ↓
✓ Build va Dependencies Check
    ↓
✓ Lint va Code Quality
    ↓
✓ Tests
    ↓
✓ Docker Image Build
    ↓
✓ Deploy to EC2
    ↓
✓ Health Check
    ↓
🎉 Deployment Complete!
```

---

✅ Setup tugallandi! Endi har qanday push `main` branchga avtomatik deploy qiladi.
