# 📋 Terms & Conditions Analyzer

<p align="center">
  <img src="https://img.shields.io/badge/AI%20Powered-Legal%20Analysis-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white"/>
  <img src="https://img.shields.io/github/license/yourusername/terms-conditions-analyzer?style=for-the-badge"/>
</p>

<p align="center">
  <b>🚀 Instantly Understand Any Terms of Service with AI 🔍</b>
</p>

<p align="center">
  <a href="https://t-and-c.onrender.com"><img src="https://img.shields.io/badge/Live%20Demo-Click%20Here-green?style=for-the-badge"/></a>
  <a href="https://youtube.com/your-video"><img src="https://img.shields.io/badge/Watch%20Demo%20Video-FF0000?logo=youtube&logoColor=white&style=for-the-badge"/></a>
</p>

---

## 👋 Welcome, Curious Reader!

**Ever clicked 'I Agree' without reading the terms?** 😬 You're not alone. That's why this project exists.

**✨ Use this tool to:**

* 🕵️ Analyze sketchy clauses
* 💡 Understand your rights
* 📉 Evaluate risk instantly

---

#

## 🔍 TL;DR – What It Does

📎 Upload a PDF, paste legal text, or link to a webpage. <br/>
🧠 GPT-4 analyzes the content with custom legal prompts. <br/>
🚦 Clauses are highlighted with red/yellow/green tags. <br/>
📊 Risks are categorized and scored from 0 to 100. <br/>
💬 Clear, simple explanations are displayed for each clause.

---

## 🔧 Tech Stack Highlights

🎨 **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui
⚙️ **Framework**: Next.js 14 (App Router)
🧠 **AI**: OpenAI GPT-4 via streaming API
🔐 **Auth**: NextAuth or JWT (switchable)
📦 **PDF/HTML Parser**: pdfjs + html-to-text + DOMPurify
☁️ **Hosting**: Vercel (CI/CD + Preview Deploys)

---


## ⚙️ Quickstart in 60s

```bash
# 1. Clone project
$ git clone https://github.com/yourusername/terms-conditions-analyzer.git
$ cd terms-conditions-analyzer

# 2. Install dependencies
$ npm install  # or yarn/pnpm

# 3. Add your OpenAI key
$ cp .env.example .env.local
$ nano .env.local  # Paste your OPENAI_API_KEY

# 4. Start the app
$ npm run dev  
```

