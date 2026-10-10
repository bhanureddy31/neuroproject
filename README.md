# NeuroDiagnosis AI — Clinical Intelligence Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-neurodiagnosis.vercel.app-0070F3?style=for-the-badge&logo=vercel&logoColor=white)](https://neurodiagnosis.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.6-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.14-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

An AI-powered clinical decision support platform for multi-pathology neurodegenerative disease screening from brain MRI scans. Built with Next.js 16, PyTorch, and Explainable AI (Grad-CAM).

---

## 🌐 Live Public Deployment

The application is deployed live and permanently accessible online:

* **Production Web URL**: **[https://neurodiagnosis.vercel.app](https://neurodiagnosis.vercel.app)**
* **Local Development URL**: `http://localhost:3000`

---

## 🧠 Key Features

- **Multi-Disease Neuro Screening**:
  - **Alzheimer’s Disease**: EfficientNet-B0 trained on axial brain MRI slices. Evaluates cognitive status across 4 severity tiers: *Non Demented*, *Very Mild Demented*, *Mild Demented*, and *Moderate Demented*.
  - **Parkinson’s Disease**: EfficientNet-B0 trained on volumetric 3D NIfTI (`.nii`, `.nii.gz`) scans with 1mm isotropic resampling and anatomical center-aligned multi-slice probability pooling.
- **Explainable AI (XAI)**:
  - Real-time **Grad-CAM backpropagation** overlays highlighting salient anatomical biomarkers (Hippocampal formation, Medial Temporal Lobes, Substantia Nigra).
- **Comprehensive Patient & Assessment Records**:
  - Track patient medical history, vital signs (BP, blood sugar), cognitive symptoms, and past assessments.
- **Professional Clinical PDF Reports**:
  - One-click exportable, formatted medical reports with patient demographics, model predictions, Grad-CAM overlays, and doctor sign-off sections.
- **Dark / Light Theme Support**:
  - Medical radiology dark mode optimized for MRI scan visualization and high-contrast clinical review.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router & Turbopack), React 19, Tailwind CSS v4, Lucide Icons
- **Backend**: Next.js API Routes + Python PyTorch Inference Engine (FastAPI microservice ready)
- **Deep Learning**: PyTorch, Torchvision, Scipy, NiBabel (3D NIfTI parsing), PIL, Matplotlib
- **Database**: LibSQL / SQLite (`@libsql/client` with Turso cloud support)
- **Reporting**: `html2canvas-pro` + `jspdf`
- **Hosting**: Vercel (Edge Network) + Docker support

---

## 🚀 Getting Started (Local Development)

### 1. Clone Repository
```bash
git clone https://github.com/bhanureddy31/neuroproject.git
cd neuroproject
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 🐳 Docker Deployment

The repository includes a complete `Dockerfile` that packages Node.js, Python 3, PyTorch, and all dependencies into a single container:

```bash
docker build -t neurodiagnosis .
docker run -p 3000:3000 neurodiagnosis
```

Access the containerized application at `http://localhost:3000`.

---

## 📁 Repository Structure

```
neurodiagnosis/
├── backend/
│   ├── run_inference.py       # Core PyTorch inference & Grad-CAM pipeline
│   └── server.py              # FastAPI microservice for cloud hosting
├── packages/
│   ├── Experiment_10_Alzheimer_Inference_Package/   # Alzheimer's checkpoint & code
│   └── Parkinson_Deployment_Package/                # Parkinson's checkpoint & code
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── assessments/   # Assessment CRUD API
│   │   │   ├── patients/      # Patient management API
│   │   │   └── predict/       # MRI Inference bridge route
│   │   └── dashboard/         # Dashboard, reports, history, & assessment UI
│   ├── components/            # Medical report & interactive UI components
│   └── db/                    # LibSQL / SQLite schema & client
├── Dockerfile                 # Complete container deployment configuration
└── README.md                  # Project documentation
```

---

## ⚖️ Research Prototype Disclaimer

> **Important**: NeuroDiagnosis is an experimental research prototype intended for academic evaluation and clinical decision-support research. It is **not clinically certified** or validated for independent medical diagnosis. All outputs should be correlated with clinical findings by licensed healthcare professionals.
