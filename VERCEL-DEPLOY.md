# 🚀 Deploy to Vercel - Complete Guide

Vercel is the easiest way to deploy your Next.js application. It's made by the creators of Next.js and handles everything automatically.

---

## ✅ Prerequisites

1. **GitHub Account** (or GitLab/Bitbucket)
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **MongoDB Database** - Get free MongoDB at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
4. **API Keys**:
   - Stripe API keys (for payments)
   - Google Maps API key (for maps)
   - Email service credentials

---

## 🎯 Step 1: Push to GitHub

### 1.1. Initialize Git (if not already done)

```bash
cd E:\nvm
git init
git add .
git commit -m "Initial commit"
```

### 1.2. Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click "New repository"
3. Name it `napa-valley-wineries` (or any name you want)
4. Click "Create repository"
5. **Don't** initialize with README, .gitignore, or license (you already have files)

### 1.3. Push to GitHub

```bash
# Connect to your remote repository
git remote add origin https://github.com/YOUR_USERNAME/napa-valley-wineries.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## 🎯 Step 2: Setup MongoDB Atlas (Free Database)

### 2.1. Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free"
3. Sign up with GitHub (easiest)

### 2.2. Create a Cluster

1. Select **AWS** as cloud provider
2. Choose the **Free tier** (M0)
3. Select a region close to you
4. Click "Create Cluster"
5. Wait 3-5 minutes for cluster to be ready

### 2.3. Configure Database Access

1. Click "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Username: `admin` (or any username)
4. Password: Click "Autogenerate Secure Password" (SAVE THIS!)
5. Privileges: "Read and write to any database"
6. Click "Add User"

### 2.4. Configure Network Access

1. Click "Network Access" (left sidebar)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Click "Confirm"

### 2.5. Get Connection String

1. Click "Databases" (left sidebar)
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Choose "Node.js" and version "4.1 or later"
5. Copy the connection string

Example:
```
mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

Replace `<password>` with your actual password (the one you saved in 2.3).

---

## 🎯 Step 3: Get API Keys

### 3.1. Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up or log in
3. Go to "Developers" → "API keys"
4. Get your **Publishable key** (starts with `pk_`)
5. Get your **Secret key** (starts with `sk_`)

### 3.2. Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Maps JavaScript API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the API key

### 3.3. Email Service (Choose one)

**Option A: Gmail**
1. Enable 2-Step Verification on your Google Account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Create an app password for "Mail"
4. Save the password

**Option B: Resend (Recommended for Production)**
1. Go to [Resend.com](https://resend.com)
2. Sign up and get API key

---

## 🎯 Step 4: Deploy to Vercel

### 4.1. Import Your Project

1. Go to [Vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Select your GitHub repository (`napa-valley-wineries`)
5. Click "Import"

### 4.2. Configure Project Settings

**Project Name**: `napa-valley-wineries` (or any name)

**Framework Preset**: Next.js (auto-detected)

**Root Directory**: `./`

**Build Command**: Leave empty (auto-detected)

**Output Directory**: Leave empty (auto-detected)

**Install Command**: Leave empty (auto-detected)

### 4.3. Add Environment Variables

Click "Environment Variables" and add these:

```env
# Database
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/nvw?retryWrites=true&w=majority
NEXT_PUBLIC_MONGO_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/nvw?retryWrites=true&w=majority

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Firebase (if using)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# App URL (auto-filled by Vercel)
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

**Important**: Replace all `YOUR_*` placeholders with actual values!

### 4.4. Deploy!

Click "Deploy" button and wait 2-3 minutes.

---

## 🎯 Step 5: Custom Domain (Optional)

1. Go to your project settings on Vercel
2. Click "Domains"
3. Add your domain (e.g., `yourdomain.com`)
4. Follow the DNS configuration instructions
5. Update `NEXT_PUBLIC_APP_URL` environment variable with your domain

---

## ✅ After Deployment

### Your app will be live at:
- `https://your-app-name.vercel.app`
- Or your custom domain if configured

### Test Your App:
1. Visit your deployed URL
2. Test user registration
3. Test login
4. Test booking functionality
5. Test payment integration

---

## 🔄 Updating Your App

Any time you push to GitHub:

1. Make changes to your code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```
3. Vercel automatically deploys the changes!

---

## 🆘 Troubleshooting

### Build Failed

Check the build logs on Vercel dashboard:
1. Go to your project
2. Click on the failed deployment
3. Check the "Logs" section

Common issues:
- Missing environment variables
- MongoDB connection issues
- API key errors

### Environment Variables Not Working

1. Go to "Settings" → "Environment Variables"
2. Make sure variables are added correctly
3. Redeploy after changing env vars

### Database Connection Issues

1. Check MongoDB Atlas Network Access (must allow Vercel IPs)
2. Verify connection string is correct
3. Make sure password is URL-encoded (special characters)

---

## 💰 Pricing

- **Hobby (Free)**: Perfect for side projects
  - Unlimited deployments
  - 100GB bandwidth
  - SSL certificates included
  - Custom domains (limited)

- **Pro ($20/month)**: For professional projects
  - Everything in Hobby
  - More bandwidth
  - Team collaboration
  - Priority support

You'll likely only need the **Free Hobby plan**!

---

## 📊 What Vercel Handles Automatically

✅ Serverless functions for API routes  
✅ Automatic HTTPS/SSL  
✅ Global CDN  
✅ Automatic deployments from Git  
✅ Preview deployments for PRs  
✅ Edge functions  
✅ Image optimization  
✅ Analytics  

You don't need to configure any of this!

---

## 🎉 You're Done!

Your app is now live on Vercel! 

**Need help?** Check the [Vercel Documentation](https://vercel.com/docs)















