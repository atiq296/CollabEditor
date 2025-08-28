
# CollabEditor ✍️🤝

CollabEditor is a **real-time collaborative document and spreadsheet editor** designed to make teamwork seamless. It supports multiple users editing together with live synchronization, AI-powered assistance, role-based permissions, and version control — all in one lightweight, scalable, and modern web platform.  

This project was developed as a Final Year Project (FYP) at **International Islamic University, Islamabad (IIUI)**.

---

## 🚀 Features
- **Real-Time Collaboration** – Multiple users can edit the same document simultaneously.  
- **Rich Text Editing** – Headings, formatting, bullet points, and more.  
- **Spreadsheet Module** – Excel-like editing with formulas (SUM, AVG, etc.).  
- **Role-Based Access Control** – Owner, Editor, and Viewer roles.  
- **Commenting & Inline Feedback** – Collaborators can add and reply to comments.  
- **AI Writing Assistance** – Grammar correction, tone enhancement, and summarization.  
- **Live Chat & Presence Indicators** – Chat with collaborators and see who’s online.  
- **Version Control** – Full version history with restore options.  
- **Export Options** – Download documents in PDF and DOCX formats.  
- **Secure Authentication** – JWT-based login and access management.  

---

## 🛠️ Tech Stack
- **Frontend:** React.js, Material UI  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (Atlas) with Mongoose  
- **Real-Time:** Socket.IO  
- **Spreadsheets:** Handsontable  
- **AI Assistance:** OpenRouter API  
- **Hosting:** Vercel (Frontend), Railway (Backend), AWS (Storage)  

---

## 📖 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- OpenRouter AI API key
- AWS account (for file storage)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/CollabEditor.git
   cd CollabEditor

Install dependencies for both frontend and backend:

cd client
npm install
cd ../server
npm install


Configure environment variables:

Frontend (.env):

REACT_APP_API_URL=http://localhost:5000


Backend (.env):

MONGO_URI=your_mongo_uri
JWT_SECRET=your_secret_key
OPENROUTER_API_KEY=your_api_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret


Run development servers:

# In one terminal (backend)
cd server
cd frontend
npm run dev

# In another terminal (frontend)
cd server
node index.js

📷 Screenshots 



👨‍💻 Authors

Abdul Sami (4472-FBAS/BSCS4/F21)

Muhammad Atique (4469-FBAS/BSCS4/F21)

Supervisor: Dr. Asim Munir, Chairman, Dept. of CS, IIUI