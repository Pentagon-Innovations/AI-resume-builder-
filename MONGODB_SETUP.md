# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account (or log in if you already have one)

## Step 2: Create a New Cluster

1. After logging in, click **"Build a Database"**
2. Choose **FREE (M0) Shared** cluster
3. Select your preferred **Cloud Provider** (AWS, Google Cloud, or Azure)
4. Choose a **Region** closest to your users (or Vercel's region)
5. Click **"Create"** (cluster name will be auto-generated)

## Step 3: Create Database User

1. In the **Security** section, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication method
4. Enter:
   - **Username**: `resumealign` (or your preferred username)
   - **Password**: Generate a strong password (save it securely!)
5. Under **"Database User Privileges"**, select **"Atlas admin"** (or **"Read and write to any database"**)
6. Click **"Add User"**

## Step 4: Configure Network Access

1. In the **Security** section, click **"Network Access"**
2. Click **"Add IP Address"**
3. For Vercel deployment, click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ **Note**: This allows access from any IP. For production, consider restricting to Vercel IPs.
4. Click **"Confirm"**

## Step 5: Get Connection String

1. Go to **"Database"** section
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as driver
5. Copy the connection string (it looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` with your database username
7. Replace `<password>` with your database password
8. Add your database name at the end:
   ```
   mongodb+srv://resumealign:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/resumeDB?retryWrites=true&w=majority
   ```

## Step 6: Test Connection

You can test the connection using MongoDB Compass or the connection string in your application.

---

## Quick Setup Summary

1. ✅ Create MongoDB Atlas account
2. ✅ Create free M0 cluster
3. ✅ Create database user (username + password)
4. ✅ Allow network access (0.0.0.0/0 for Vercel)
5. ✅ Get connection string
6. ✅ Add to Vercel environment variables as `MONGODB_URI`

---

## Vercel Environment Variable

Add this to your backend project:
```
MONGODB_URI = mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/resumeDB?retryWrites=true&w=majority
```

Replace:
- `username` = Your database username
- `password` = Your database password
- `cluster0.xxxxx` = Your cluster address
- `resumeDB` = Your database name (can be anything)

