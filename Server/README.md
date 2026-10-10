# DengueGuard Server (Backend & AI Microservice)

The backend layer for **DengueGuard**, consisting of:
1. **Node.js & Express REST API**: Authenticated business logic, MongoDB persistence, PDF/Excel/CSV report export engines, and role-based workflows.
2. **Python AI Microservice**: YOLOv8 computer vision detection and Scikit-Learn Random Forest multi-factor risk inference.

---

## 🚀 Quick Start

### 1. Backend REST API (Node.js)

```bash
# 1. Install Node.js dependencies
npm install

# 2. Configure Environment Variables
# Copy .env.example to .env
cp .env.example .env

# 3. Seed demo accounts and initial test dataset (Optional but recommended)
npm run seed

# 4. Start the Express development server
npm run dev
```
The API starts at `http://localhost:5000` (or `http://localhost:5050` depending on your `PORT` config).

---

### 2. AI Model Microservice (Python & FastAPI)

The AI inference microservice operates from the `ai_model/` directory.

```bash
# 1. Navigate to the AI model directory (or run from root with Server/ai_model)
cd ai_model

# 2. (Optional) Create and activate a Python virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 3. Install required Python packages
pip install -r requirements.txt

# 4. Start the FastAPI AI service
python ai_service.py
```
*(Alternatively, from the `Server/` directory, you can run `npm run ai:start`).*

The AI service starts at `http://127.0.0.1:5001`.

---

## 🛠️ Available NPM Scripts

- `npm run dev`: Starts the Node.js API with Nodemon auto-reload.
- `npm start`: Starts the Node.js API in production mode.
- `npm run seed`: Clears and seeds database with default roles (Citizen, PHI, Admin) and mock data.
- `npm run ai:start`: Launches the Python FastAPI AI inference service.
- `npm run ai:test`: Runs test verification scenarios against the Random Forest risk model.
- `npm run ai:train`: Retrains the Random Forest models on `dengue_data.csv`.

---

## 🧠 AI Model Components (`ai_model/`)

- `best.pt`: Custom-trained YOLOv8 weights detecting mosquito breeding containers (`Tire`, `Coconut-Exocarp`, `Drain-Inlet`, `Vase`, `Bottle`).
- `risk_model.pkl`: Serialized Scikit-Learn bundle (`RandomForestClassifier` + `RandomForestRegressor`) fusing visual hazard scores, confidence, 7-day rainfall, NDCU district cases, and report density.
- `dengue_data.csv`: Reference multi-factor dataset for risk training.
- `ai_service.py`: FastAPI server exposing `/predict`, `/retrain`, and `/health` endpoints.
- `test_prediction.py`: Standalone CLI suite validating model predictions against standard health scenarios.

---

## ⚙️ Environment Variables (`.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Express server port | `5000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/dengueguard` |
| `JWT_SECRET` | Secret key for JWT token signing (min 32 chars) | Required |
| `JWT_EXPIRES_IN` | Token validity duration | `7d` |
| `CORS_ORIGIN` | Allowed client origin(s) | `http://localhost:5173` |
| `AI_SERVICE_URL` | Endpoint for Python AI service | `http://127.0.0.1:5001` |
| `SEED_PASSWORD` | Password assigned to demo users during `npm run seed` | `demo1234` |