# Deployment Guide

## ⚠️ **GitHub Pages Limitation**

**GitHub Pages only supports static websites** (HTML, CSS, JavaScript). It cannot run server-side code like Python Flask applications.

## 🚫 **Why This App Won't Work on GitHub Pages**

This wage calculator app requires:
- **Python Flask backend** (server-side processing)
- **File system access** (to save/load JSON data)
- **API endpoints** (for data operations)
- **Server-side calculations** (overtime, wage calculations)

GitHub Pages only serves static files and cannot execute Python code.

## ✅ **Alternative Free Deployment Options**

### 1. **Render.com** (Recommended - Free Tier)
- Supports Python Flask apps
- Free tier includes 750 hours/month
- Easy deployment from GitHub
- Automatic HTTPS

**Steps:**
1. Push your code to GitHub
2. Sign up at render.com
3. Connect your GitHub repository
4. Choose "Web Service"
5. Set build command: `pip install -r requirements.txt`
6. Set start command: `gunicorn app:app`
7. Deploy!

### 2. **Railway.app** (Free Tier)
- Modern deployment platform
- Free tier available
- Easy GitHub integration

### 3. **Heroku** (Paid - but very reliable)
- Industry standard
- Free tier discontinued, but very affordable paid plans
- Excellent documentation

### 4. **PythonAnywhere** (Free Tier)
- Python-focused hosting
- Free tier available
- Good for learning and small projects

## 📋 **Requirements for Deployment**

Create a `requirements.txt` file:

```txt
Flask==2.3.3
gunicorn==21.2.0
```

## 🔧 **Production Considerations**

For production deployment, consider:

1. **Database**: Replace JSON file storage with a proper database (SQLite, PostgreSQL)
2. **Environment Variables**: Store sensitive data in environment variables
3. **HTTPS**: Ensure SSL certificate is enabled
4. **Backup**: Implement data backup strategies
5. **Monitoring**: Add logging and error tracking

## 🎯 **Quick Start with Render**

1. **Create requirements.txt:**
```txt
Flask==2.3.3
gunicorn==21.2.0
```

2. **Push to GitHub:**
```bash
git add .
git commit -m "Add deployment files"
git push origin main
```

3. **Deploy on Render:**
- Go to render.com
- Connect your GitHub repo
- Choose "Web Service"
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app`
- Deploy!

Your app will be available at `https://your-app-name.onrender.com`

## 💡 **Alternative: Static Version**

If you want to use GitHub Pages, you'd need to:
1. Convert the app to pure JavaScript
2. Use browser localStorage instead of server-side storage
3. Move all calculations to client-side
4. Remove server-side features

This would be a significant rewrite and would lose some functionality. 