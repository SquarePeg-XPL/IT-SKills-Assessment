# IT Skills Assessment Tool

A comprehensive skills assessment application that evaluates employees across technical and soft skill competencies using AI-powered conversational analysis.

## Features

- Interactive conversational assessment
- Evaluates 8 technical areas and 6 soft skills
- Scores on 0-5 scale aligned with skills matrix
- Generates personalized development recommendations
- Exportable results in JSON format

## Tech Stack

- Next.js 14
- React 18
- Lucide React (icons)
- Claude API (Sonnet 4)

## Deployment to Vercel

### Method 1: GitHub Deploy (Recommended)

1. Create a new GitHub repository
2. Push this code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/skills-assessment.git
   git push -u origin main
   ```
3. Go to [vercel.com](https://vercel.com) and click "Add New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js settings
6. Click "Deploy"

### Method 2: Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Deploy:
   ```bash
   vercel
   ```
3. Follow the prompts

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Share the deployed URL with employees
2. Employees click "Begin Assessment"
3. Answer questions conversationally
4. Receive scored results and development plan
5. Export results for record-keeping

## Skills Assessed

**Technical:**
- Infrastructure & Systems
- Cloud Technologies
- Security & Compliance
- Development & Programming
- Database Management
- Networking
- IT Service Management
- Automation & Scripting

**Soft Skills:**
- Leadership
- Communication
- Problem Solving
- Collaboration
- Adaptability
- Critical Thinking