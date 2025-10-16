# 🚀 Quick Deployment Guide - Voice Integration

## Pre-Deployment Checklist

✅ All files created and updated  
✅ No TypeScript errors  
✅ Environment variables configured locally  
⚠️ Need to add environment variable to Vercel  

---

## Deployment Steps

### **Step 1: Add Environment Variable to Vercel** ⚠️ REQUIRED

**Option A: Vercel Dashboard (Recommended)**

1. Go to: https://vercel.com/kawotwe/emma-digital-twin-mcp/settings/environment-variables
2. Click "Add New"
3. Fill in:
   - **Key**: `ELEVENLABS_API_KEY`
   - **Value**: `sk_b2107dbae266aabfeda89f17f1c7a426f2e4fb39339d3483`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
4. Click "Save"

**Option B: Vercel CLI**

```powershell
cd C:\Users\emman\Digital_Twin\mydigitaltwin

# Login to Vercel (if not already)
vercel login

# Add environment variable
vercel env add ELEVENLABS_API_KEY
# When prompted, paste: sk_b2107dbae266aabfeda89f17f1c7a426f2e4fb39339d3483
# Select: Production, Preview, Development
```

---

### **Step 2: Build Locally (Optional Test)**

```powershell
cd C:\Users\emman\Digital_Twin\mydigitaltwin

# Clean install
pnpm install

# Build
pnpm run build

# If build succeeds, you're good to deploy!
```

---

### **Step 3: Deploy to Vercel**

```powershell
cd C:\Users\emman\Digital_Twin\mydigitaltwin

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Step 10: ElevenLabs voice integration - STT, TTS, 16 MCP tools"

# Push to main branch (triggers auto-deploy)
git push origin main
```

Vercel will automatically:
- Detect the push
- Install dependencies
- Build your app
- Deploy to production
- Update: https://emma-digital-twin-mcp.vercel.app

---

### **Step 4: Verify Deployment** 

#### **4.1: Check Health**
```bash
curl https://emma-digital-twin-mcp.vercel.app/api/health
```
Expected: `{"status":"ok"}`

#### **4.2: Check Voice Endpoints**

**Get Available Voices:**
```bash
curl https://emma-digital-twin-mcp.vercel.app/api/voice/voices
```
Expected: JSON array with voice list

**Test Text-to-Speech (Simple):**
```bash
curl -X POST https://emma-digital-twin-mcp.vercel.app/api/voice/speak \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, I am Emmanuel digital twin"}' \
  --output test.mp3
```
Expected: Audio file `test.mp3` created

#### **4.3: Test in Claude Desktop**

1. Open Claude Desktop
2. Check MCP tools (should show **16 tools**)
3. Use `get_available_voices` tool
4. Use `text_to_speech` tool with test text

---

## Post-Deployment Testing

### **Test Voice Flow End-to-End:**

```powershell
# 1. Get voices
curl https://emma-digital-twin-mcp.vercel.app/api/voice/voices | jq .

# 2. Generate speech
curl -X POST https://emma-digital-twin-mcp.vercel.app/api/voice/speak \
  -H "Content-Type: application/json" \
  -d '{"text":"Tell me about your TypeScript experience"}' \
  --output emmanuel_response.mp3

# 3. Play the audio (Windows)
Start-Process emmanuel_response.mp3
```

---

## Troubleshooting

### **Issue: 500 Error on Voice Endpoints**

**Cause:** Environment variable not set in Vercel

**Fix:**
1. Go to Vercel dashboard
2. Settings → Environment Variables
3. Add `ELEVENLABS_API_KEY`
4. Redeploy (Settings → Deployments → Latest → Redeploy)

### **Issue: "ELEVENLABS_API_KEY not configured"**

**Cause:** Environment variable typo

**Fix:**
```powershell
# Check .env.local
cat .env.local | Select-String "ELEVENLABS"

# Should show:
# ELEVENLABS_API_KEY=sk_b2107dbae266aabfeda89f17f1c7a426f2e4fb39339d3483
```

### **Issue: MCP Shows Only 14 Tools Instead of 16**

**Cause:** Build/deployment issue

**Fix:**
1. Check deployment logs in Vercel
2. Look for TypeScript errors
3. Redeploy if needed

---

## Success Indicators

✅ Health endpoint returns `{"status":"ok"}`  
✅ `/api/voice/voices` returns voice array  
✅ `/api/voice/speak` generates audio files  
✅ Claude Desktop shows **16 MCP tools**  
✅ `get_available_voices` tool works  
✅ `text_to_speech` tool works  
✅ No console errors in Vercel logs  

---

## Next Steps After Deployment

### **1. Test Voice Quality**
Try different voices:
```bash
curl -X POST https://emma-digital-twin-mcp.vercel.app/api/voice/speak \
  -H "Content-Type: application/json" \
  -d '{"text":"Test different voices","voiceId":"21m00Tcm4TlvDq8ikWAM"}' \
  --output voice_test.mp3
```

### **2. Monitor Usage**
- Check ElevenLabs dashboard: https://elevenlabs.io/app/usage
- Track character usage
- Monitor costs

### **3. Integrate with V0 App** (Optional)
See STEP10_VOICE_INTEGRATION.md section "V0 RAG App Integration"

### **4. Security: Rotate API Key** ⚠️
Your API key is visible in documentation. Consider rotating:
1. https://elevenlabs.io/app/settings/api-keys
2. Generate new key
3. Update Vercel environment variable
4. Update `.env.local`

---

## Deployment Timeline

| Step | Time | Status |
|------|------|--------|
| Add env var to Vercel | 2 min | ⏳ Pending |
| Local build test | 3 min | Optional |
| Git commit & push | 1 min | Ready |
| Vercel build & deploy | 3-5 min | Auto |
| Verification | 2 min | After deploy |
| **Total** | **~10 min** | |

---

## Quick Commands Summary

```powershell
# 1. Add environment variable (Vercel Dashboard)
# https://vercel.com/kawotwe/emma-digital-twin-mcp/settings/environment-variables

# 2. Deploy
cd C:\Users\emman\Digital_Twin\mydigitaltwin
git add .
git commit -m "Step 10: Voice integration"
git push origin main

# 3. Test
curl https://emma-digital-twin-mcp.vercel.app/api/health
curl https://emma-digital-twin-mcp.vercel.app/api/voice/voices

# 4. Verify MCP tools in Claude Desktop
```

---

**Ready to Deploy?** Follow steps 1-4 above! 🚀
