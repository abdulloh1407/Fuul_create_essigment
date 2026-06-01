# CI/CD Integration Guide - Final Steps

## 🎯 What's Been Set Up

Your CRM system now has a **professional-grade CI/CD pipeline** with:

✅ **Automated Testing** - Linting, code format, unit tests  
✅ **Security Scanning** - Dependency audits, CodeQL analysis  
✅ **Docker Integration** - Automated image builds and registry push  
✅ **EC2 Deployment** - Automatic deployment to production  
✅ **Health Monitoring** - Regular endpoint and database checks  
✅ **Rollback Support** - Easy deployment rollback capability  

---

## 📋 Action Items

### Step 1: Add GitHub Secrets (5 mins)

1. Go to GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:

| Name | Value |
|------|-------|
| `EC2_HOST` | Your EC2 public IP or domain |
| `EC2_USERNAME` | `ubuntu` (default AWS AMI user) |
| `EC2_PRIVATE_KEY` | Contents of your `.pem` file |

**To get your EC2_PRIVATE_KEY:**
```bash
# Linux/Mac
cat ~/.ssh/your-ec2-key.pem

# Windows PowerShell
Get-Content C:\Users\YourName\.ssh\your-ec2-key.pem
```

### Step 2: Prepare EC2 Instance (10 mins)

```bash
# SSH into your EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Create project directory
mkdir -p /home/ubuntu/crm-system
cd /home/ubuntu/crm-system

# Create .env file
cat > .env << EOF
PORT=3000
DB_USER=postgres
DB_HOST=db
DB_NAME=crm_db
DB_PASSWORD=adminpassword
DB_PORT=5432
NODE_ENV=production
EOF

# Secure the .env file
chmod 600 .env
```

### Step 3: Test Locally (5 mins)

```bash
# Linux/Mac
chmod +x test-ci-cd.sh
./test-ci-cd.sh

# Windows
test-ci-cd.bat
```

### Step 4: Make Your First Deploy

```bash
# Make a change and commit
git add .
git commit -m "Setup CI/CD pipeline"
git push origin main

# Watch the magic! 🎉
# Go to GitHub → Actions tab to monitor
```

---

## 🔍 Monitoring Deployments

### Real-time Status
1. GitHub → **Actions** tab
2. Click on the latest workflow run
3. Watch each job execute

### Logs to Check

**GitHub Actions:**
- Build logs: Shows npm install, lint, test results
- Docker logs: Shows image build status
- Deploy logs: Shows SSH commands and results

**EC2 Deployment:**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
cd /home/ubuntu/crm-system

# View container status
docker-compose ps

# View application logs
docker-compose logs web

# View database logs
docker-compose logs db

# Test the application
curl http://localhost:3000
```

---

## 📊 Pipeline Workflow

### When You Push to `main`:
```
✓ Code Quality Checks (Lint, Format)
✓ Run Tests
✓ Security Scanning
✓ Build Docker Image
✓ Deploy to EC2
✓ Run Health Checks
```

### When You Push to `develop`:
```
✓ Code Quality Checks (Lint, Format)
✓ Run Tests
✓ Security Scanning
✓ Build Docker Image
✗ Skip Deployment (intentional)
```

### When You Create a Pull Request:
```
✓ Code Quality Checks (Lint, Format)
✓ Run Tests
✗ Skip Docker Build
✗ Skip Deployment
```

---

## 🆘 Troubleshooting

### "Authentication Failed" on Deployment
- **Cause**: GitHub Secrets not set correctly
- **Fix**: 
  1. Re-verify EC2_HOST (should be IP or domain)
  2. Re-verify EC2_USERNAME (usually `ubuntu`)
  3. Re-verify EC2_PRIVATE_KEY (entire PEM content)

### "Docker Build Failed"
- **Check**: 
  ```bash
  npm install  # Local test
  docker build .  # Local Docker build
  ```
- **Common Issues**:
  - Missing `package.json`
  - Node version mismatch
  - Dependency installation error

### "Deployment Hangs"
- **Check**: SSH timeout (currently set to 10 minutes)
- **Increase if needed** in `deploy.yml`
- **Monitor EC2**: 
  ```bash
  ssh -i your-key.pem ubuntu@your-ec2-ip
  docker-compose logs
  ```

### "Health Check Fails After Deploy"
- **Check**: 
  ```bash
  # On EC2
  docker-compose ps
  curl http://localhost:3000
  ```
- **Common Issues**:
  - Application crashed
  - Database not ready
  - Port already in use

---

## 📈 Best Practices

1. **Always test locally first**
   ```bash
   npm install
   npm run lint
   npm test
   docker build .
   ```

2. **Use descriptive commit messages**
   ```bash
   git commit -m "Feature: Add user authentication"
   ```

3. **Review GitHub Actions logs** before troubleshooting EC2

4. **Monitor health checks** - Set up notifications for failures

5. **Keep dependencies updated**
   ```bash
   npm outdated
   npm audit fix
   ```

---

## 📞 Support

- **GitHub Actions**: [docs.github.com/en/actions](https://docs.github.com/en/actions)
- **Docker**: [docs.docker.com](https://docs.docker.com)
- **Express.js**: [expressjs.com](https://expressjs.com)
- **PostgreSQL**: [postgresql.org/docs](https://postgresql.org/docs)

---

## ✨ You're All Set!

```
🎉 CI/CD Pipeline is Ready!

When you're ready:
1. ✅ Set GitHub Secrets
2. ✅ Configure EC2 .env
3. ✅ Push to main branch
4. ✅ Watch it deploy automatically!
```

**Questions?** Check the detailed documentation:
- `CI-CD-SETUP.md` - Complete configuration guide
- `QUICK-SETUP.md` - Fast reference
- `CI-CD-SUMMARY.md` - Architecture overview

Happy Coding! 🚀
