# 🚀 Deploy do ASO Validator AI

Como este é um aplicativo React (Vite), você tem várias opções gratuitas e rápidas para publicar.

## Opção 1: Netlify Drop (Mais Fácil - Sem Git)

Esta opção é ideal se você quer apenas ver o app online agora, sem configurar repositórios.

1.  Localize a pasta `dist` no seu projeto:
    `/Users/arthurcardoso/Desktop/vscode-chatgpt/dist`
2.  Acesse [app.netlify.com/drop](https://app.netlify.com/drop).
3.  Arraste a pasta `dist` para a área indicada na página.
4.  O site estará online em segundos!

## Opção 2: Vercel (Recomendado para Produção)

Ideal para atualizações automáticas via GitHub.

1.  Crie um repositório no [GitHub](https://github.com/new).
2.  Envie seu código:
    ```bash
    git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
    git branch -M main
    git push -u origin main
    ```
3.  Acesse [vercel.com](https://vercel.com) e faça login com GitHub.
4.  Clique em "Add New..." -> "Project".
5.  Importe seu repositório.
6.  A Vercel detectará automaticamente que é um projeto Vite.
7.  **Importante**: Adicione a variável de ambiente `VITE_API_KEY` nas configurações do projeto na Vercel (Settings -> Environment Variables).
8.  Clique em "Deploy".

## Opção 3: Surge.sh (Via Linha de Comando)

Se você quiser publicar direto do terminal agora mesmo:

1.  Instale o Surge:
    ```bash
    npm install --global surge
    ```
2.  Rode o comando na pasta `dist`:
    ```bash
    cd dist
    surge
    ```
3.  Crie uma conta (email/senha) ali mesmo no terminal.
4.  Escolha um domínio (ex: `aso-validator.surge.sh`).
5.  Pronto!

---
**Nota sobre a API Key**: Como este é um app frontend-only, sua chave de API ficará exposta no código do navegador. Para produção real com alta segurança, recomenda-se criar um backend proxy, mas para testes ou uso interno controlado, o método atual funciona.
