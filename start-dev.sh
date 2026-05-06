#!/bin/bash
set -e
echo "=== ScamRadar Dev ==="

cd backend
python3.13 -m venv .venv 2>/dev/null || true
source .venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "[backend] starting on :8001 ..."
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &
BPID=$!
cd ..

cd frontend
npm install --silent
echo "[frontend] starting on :5174 ..."
npm run dev &
FPID=$!
cd ..

echo ""
echo "✅ ScamRadar running:"
echo "   App:  http://localhost:5174"
echo "   API:  http://localhost:8001/api/docs"
echo ""
echo "Ctrl+C to stop."
trap "kill $BPID $FPID 2>/dev/null; exit" INT TERM
wait
