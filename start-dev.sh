#!/bin/bash

echo "🚀 Starting RecruiterV Development Servers..."
echo ""

# Check if node is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js v20+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if dependencies are installed
if [ ! -d "Backend/node_modules" ]; then
    echo "📦 Installing Backend dependencies..."
    cd Backend && npm install && cd ..
fi

if [ ! -d "Frontend/node_modules" ]; then
    echo "📦 Installing Frontend dependencies..."
    cd Frontend && npm install && cd ..
fi

# Check if .local.env exists
if [ ! -f "Backend/.local.env" ]; then
    echo "⚠️  Warning: Backend/.local.env file not found!"
    echo "Please configure your environment variables in Backend/.local.env"
    echo "See SETUP_GUIDE.md for details."
    echo ""
fi

echo "🔧 Starting Backend Server..."
echo "Backend will run on: http://localhost:5000"
echo ""

# Start backend in background
cd Backend
node index.js &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

echo "🎨 Starting Frontend Server..."
echo "Frontend will run on: http://localhost:5173"
echo ""

# Start frontend
cd Frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers are starting..."
echo ""
echo "📝 Backend PID: $BACKEND_PID"
echo "📝 Frontend PID: $FRONTEND_PID"
echo ""
echo "🌐 Open your browser to: http://localhost:5173"
echo ""
echo "To stop the servers, press Ctrl+C or run:"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Wait for user to stop
wait
