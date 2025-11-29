# Deploy Rápido com Render (Recomendado)

## 1. Preparar Repositório Git

```bash
cd /Users/arthurcardoso/Desktop/vscode-chatgpt
git init
git add .
git commit -m "Cronômetro web - pronto para deploy"
git branch -M main
```

## 2. Fazer Push para GitHub

```bash
# Crie repositório em github.com
git remote add origin https://github.com/SEU_USUARIO/cronometro-web.git
git push -u origin main
```

## 3. Deploy no Render

1. Acesse https://render.com (crie conta gratuita)
2. Clique "New +" → "Web Service"
3. Selecione "Connect a repository" → seu repositório
4. Configure:
   - **Name:** `cronometro-web`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn gggggf:app`
5. Clique "Create Web Service"
6. Aguarde 2-3 minutos ⏳

**Sua URL:** `https://cronometro-web.onrender.com`

---

## Alternativa: Railway (Ainda mais fácil)

1. Acesse https://railway.app
2. Clique "New Project"
3. Selecione "Deploy from GitHub"
4. Autorize e selecione seu repositório
5. Deploy automático! 🚀

**Sua URL:** Gerada automaticamente pelo Railway

---

## Teste Local Antes de Deploy

```bash
# Instalar dependências
pip install -r requirements.txt

# Rodar localmente
python3 gggggf.py

# Abrir em http://localhost:5000
```

---

## Dicas Importantes

✅ **Certifique-se que:**
- `requirements.txt` está correto
- `Procfile` existe e aponta para `gggggf:app`
- Código foi commitado no Git
- Repositório está público (se usando Render gratuito)

⚠️ **Limites gratuitos:**
- Render: App hiberna após 15 min sem uso
- Railway: 5$ de crédito mensal
- PythonAnywhere: 100 requisições/dia

💡 **Se quiser sempre online:**
- Railway oferece plano pago (~$5/mês)
- Render oferece plano pago ($7/mês)

