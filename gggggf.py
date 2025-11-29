from flask import Flask, render_template_string
import os

app = Flask(__name__)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⏱️ Cronômetro Moderno</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }
        
        h1 {
            color: white;
            margin-bottom: 10px;
            font-size: 2.5em;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        
        .subtitle {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        
        .input-group {
            margin-bottom: 20px;
        }
        
        input[type="number"] {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 1.2em;
            background: rgba(255, 255, 255, 0.9);
            color: #333;
            transition: all 0.3s ease;
        }
        
        input[type="number"]:focus {
            outline: none;
            background: white;
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        }
        
        .display {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            padding: 40px 20px;
            margin: 30px 0;
            min-height: 150px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .time {
            font-size: 4em;
            font-weight: bold;
            color: white;
            font-family: 'Courier New', monospace;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        
        .time.warning {
            color: #ffd700;
            animation: pulse 0.5s infinite;
        }
        
        .time.danger {
            color: #ff4444;
            animation: pulse 0.3s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }
        
        .buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        button {
            padding: 12px 30px;
            border: none;
            border-radius: 10px;
            font-size: 1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .btn-start {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            flex: 1;
            min-width: 120px;
        }
        
        .btn-start:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        
        .btn-pause {
            background: #ff9800;
            color: white;
            flex: 1;
            min-width: 120px;
        }
        
        .btn-pause:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(255, 152, 0, 0.4);
        }
        
        .btn-reset {
            background: #f44336;
            color: white;
            flex: 1;
            min-width: 120px;
        }
        
        .btn-reset:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(244, 67, 54, 0.4);
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .message {
            color: rgba(255, 255, 255, 0.9);
            margin-top: 20px;
            font-size: 1.1em;
            min-height: 30px;
        }
        
        .message.error {
            color: #ff4444;
        }
        
        .message.success {
            color: #44ff44;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⏱️ CRONÔMETRO</h1>
        <p class="subtitle">Moderno e responsivo</p>
        
        <div class="input-group">
            <input 
                type="number" 
                id="secondsInput" 
                placeholder="Digite os segundos" 
                min="1"
                value="10"
            >
        </div>
        
        <div class="display">
            <div class="time" id="timeDisplay">00:00</div>
        </div>
        
        <div class="buttons">
            <button class="btn-start" id="startBtn" onclick="startTimer()">▶ Iniciar</button>
            <button class="btn-pause" id="pauseBtn" onclick="pauseTimer()" disabled>⏸ Pausar</button>
            <button class="btn-reset" id="resetBtn" onclick="resetTimer()">🔄 Reset</button>
        </div>
        
        <div class="message" id="message"></div>
    </div>

    <script>
        let totalSeconds = 0;
        let remainingSeconds = 0;
        let isRunning = false;
        let timerInterval = null;

        function updateDisplay() {
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            document.getElementById('timeDisplay').textContent = display;
            
            const timeElement = document.getElementById('timeDisplay');
            timeElement.classList.remove('warning', 'danger');
            
            if (remainingSeconds <= 5 && remainingSeconds > 0) {
                timeElement.classList.add('danger');
            } else if (remainingSeconds <= 10 && remainingSeconds > 5) {
                timeElement.classList.add('warning');
            }
        }

        function startTimer() {
            if (isRunning) return;
            
            if (totalSeconds === 0) {
                const input = parseInt(document.getElementById('secondsInput').value);
                if (isNaN(input) || input < 1) {
                    showMessage('Digite um número válido!', 'error');
                    return;
                }
                totalSeconds = input;
                remainingSeconds = totalSeconds;
            }
            
            isRunning = true;
            document.getElementById('startBtn').disabled = true;
            document.getElementById('pauseBtn').disabled = false;
            document.getElementById('secondsInput').disabled = true;
            
            timerInterval = setInterval(() => {
                if (remainingSeconds > 0) {
                    remainingSeconds--;
                    updateDisplay();
                } else {
                    clearInterval(timerInterval);
                    isRunning = false;
                    showMessage('🎉 Tempo acabou!', 'success');
                    document.getElementById('startBtn').disabled = false;
                    document.getElementById('pauseBtn').disabled = true;
                    document.getElementById('secondsInput').disabled = false;
                }
            }, 1000);
            
            showMessage('');
        }

        function pauseTimer() {
            if (!isRunning) return;
            
            clearInterval(timerInterval);
            isRunning = false;
            document.getElementById('startBtn').disabled = false;
            document.getElementById('pauseBtn').disabled = true;
            showMessage('Pausado ⏸');
        }

        function resetTimer() {
            clearInterval(timerInterval);
            isRunning = false;
            totalSeconds = 0;
            remainingSeconds = 0;
            
            document.getElementById('startBtn').disabled = false;
            document.getElementById('pauseBtn').disabled = true;
            document.getElementById('secondsInput').disabled = false;
            
            const timeElement = document.getElementById('timeDisplay');
            timeElement.classList.remove('warning', 'danger');
            
            updateDisplay();
            showMessage('');
        }

        function showMessage(msg, type = '') {
            const messageElement = document.getElementById('message');
            messageElement.textContent = msg;
            messageElement.className = 'message ' + type;
        }

        // Initialize display
        updateDisplay();
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

if __name__ == '__main__':
    import os
    
    port = int(os.environ.get('PORT', 5000))
    is_production = os.environ.get('FLASK_ENV') == 'production'
    
    print("🚀 Servidor rodando em http://localhost:5000")
    print("Abra seu navegador e acesse: http://localhost:5000")
    
    app.run(
        debug=not is_production,
        host='0.0.0.0',
        port=port
    )
