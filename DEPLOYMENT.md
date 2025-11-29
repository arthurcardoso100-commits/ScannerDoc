# 🚀 Guia de Deploy - Cronômetro Web

## Opções de Hospedagem Gratuita

### 1️⃣ **Render** (Recomendado - Fácil e Gratuito)
**Pros:** Gratuito, fácil de usar, suporta Python/Flask
**Cons:** Pode dormitar se não tiver tráfego

**Passos:**
1. Crie uma conta em [render.com](https://render.com)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Runtime:** Python 3
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn gggggf:app`
5. Deploy automático!

---

### 2️⃣ **Railway** (Muito Fácil)
**Pros:** Interface intuitiva, deploy rápido
**Cons:** Precisa de cartão de crédito (mesmo sendo gratuito)

**Passos:**
1. Acesse [railway.app](https://railway.app)
2. Conecte GitHub
3. Selecione o repositório
4. Deploy automático em segundos

---

### 3️⃣ **PythonAnywhere** (Específico para Python)
**Pros:** Feito para Python, fácil configuração
**Cons:** Plano gratuito limitado

**Passos:**
1. Crie conta em [pythonanywhere.com](https://www.pythonanywhere.com)
2. Upload do código
3. Configure a web app Flask
4. Pronto!

---

### 4️⃣ **Heroku** (Antigo favorito, agora pago)
⚠️ Heroku descontinuou plano gratuito em 2022

---

## Preparação do Código

### 📦 Criar `requirements.txt`

```bash
flask==2.3.0
gunicorn==21.0.0
```

### 🔧 Atualizar `gggggf.py` para produção

Adicione no final:
```python
import os

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
```

---

## Passo a Passo Completo (Render + GitHub)

### 1. Criar repositório GitHub

```bash
cd /Users/arthurcardoso/Desktop/vscode-chatgpt
git init
git add .
git commit -m "Initial commit: Cronômetro web"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/cronometro-web.git
git push -u origin main
```

### 2. Configurar no Render

1. Acesse [render.com](https://render.com)
2. Clique "New Web Service"
3. Selecione seu repositório
4. Configure:
   ```
   Name: cronometro-web
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn gggggf:app
   ```
5. Clique "Create Web Service"
6. Aguarde ~2 minutos
7. Seu app estará em: `https://cronometro-web.onrender.com`

---

## Configuração Avançada (Variáveis de Ambiente)

Se precisar de segurança:

**Em `gggggf.py`:**
```python
import os
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key')
```

**No Render (Environment tab):**
```
SECRET_KEY = sua-chave-secreta-aqui
```

---

## Monitoramento e Logs

**Render:**
- Dashboard mostra logs em tempo real
- Alertas automáticos

**Railway:**
- Logs integrados no painel
- Histórico de deploys

---

## Domínio Customizado

1. Compre domínio em [Namecheap](https://namecheap.com) ou [GoDaddy](https://godaddy.com)
2. Configure DNS (CNAME) para apontar para seu host
3. Adicione no painel de configurações da hospedagem

---

## Alternativa: Deploy Local com Ngrok (teste rápido)

```bash
pip install ngrok
ngrok http 5000
```

Gera URL pública para testar remotamente!

---

## Resumo Recomendado

| Plataforma | Dificuldade | Custo | Deploy |
|-----------|-----------|------|--------|
| **Render** | ⭐⭐☆ | Gratuito | ~2 min |
| **Railway** | ⭐⭐☆ | Gratuito* | ~1 min |
| **PythonAnywhere** | ⭐⭐⭐ | Gratuito | ~5 min |

**Railway requer cartão (não cobra se usar pouco)

---

## Próximos Passos

1. ✅ Criar `requirements.txt`
2. ✅ Preparar repositório Git
3. ✅ Escolher plataforma
4. ✅ Fazer deploy
5. ✅ Compartilhar URL com mundo! 🌍

