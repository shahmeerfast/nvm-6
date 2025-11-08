# ⚡ Quick Start: Deploy to Vercel in 5 Minutes

## 🎯 Step 1: Push to GitHub (2 minutes)

```bash
# If you haven't already
git init
git add .
git commit -m "Ready for Vercel deployment"

# Create GitHub repo at github.com/new, then:
git remote add origin https://github.com/YOUR_USERNAME/napa-valley-wineries.git
git branch -M main
git push -u origin main
```

---

## 🎯 Step 2: Deploy to Vercel (3 minutes)

### 2.1. Sign up at Vercel
- Go to [vercel.com](https://vercel.com)
- Sign up with GitHub (one click)

### 2.2. Import Project
1. Click "Add New..." → "Project"
2. Select your GitHub repo
3. Click "Import"

### 2.3. Add Environment Variables
Click "Environment Variables" and add these **one by one**:

```env
MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster.xxx.mongodb.net/nvw?retryWrites=true&w=majority
NEXT_PUBLIC_MONGO_URI=mongodb+srv://admin:PASSWORD@cluster.xxx.mongodb.net/nvw?retryWrites=true&w=majority

JWT_SECRET=random-secret-key-at-least-32-chars-long

EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

STRIPE_SECRET_KEY=sk_test_YOUR_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_KEY

NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

**Important**: Replace all values with your actual credentials!

### 2.4. Deploy
- Click "Deploy"
- Wait 2-3 minutes
- Done! ✨

---

## ✅ Your App is Live!

Visit: `https://your-app-name.vercel.app`

---

## 🔄 Updating Your App

Every time you push to GitHub, Vercel auto-deploys!

```bash
git add .
git commit -m "Update"
git push
```

That's it! 🎉

---

## 📚 Need More Help?

- Full guide: See `VERCEL-DEPLOY.md`
- MongoDB setup: https://www.mongodb.com/cloud/atlas (Free tier available!)
- Vercel docs: https://vercel.com/docs








