# chatBot

## Instruções de execução

1. Abra o terminal na pasta do projeto:
    - Exemplo:
   ```bash
   cd "/Users/joaobarbosa/Documents/ESTG/3º Ano/2º Semestre/AO/chatBot"
   ```

2. Instale as dependências do projeto:
     ```bash
     npm install
     ```

3. Execute o projeto:
   - Docker:
     ```bash
     npm run dev
     ```
   - Modo local antigo, sem Docker:
     ```bash
     npm run dev:local
     ```

4. Para interromper a execução, utilize `Ctrl+C`.

## Executar com Docker

O projeto fica dividido em dois serviços:

- `frontend`: build Vite servido por `nginx` na porta `4173`
- `api`: servidor Node responsável pelo endpoint `/api/ollama-chat` na porta `4174`

### 1. Preparar variáveis de ambiente

Crie um ficheiro dedicado ao Docker a partir do exemplo:

```bash
cp .env.example .env.docker
```

A variável principal a validar é `OLLAMA_API_BASE_URL`:

- use `http://host.docker.internal:11434` se o Ollama estiver a correr na tua máquina
- use o URL remoto real se estiveres a consumir uma API externa

### 2. Construir e arrancar os contentores

```bash
docker compose up --build
```

Atalho equivalente via `npm`:

```bash
npm run dev:docker:build
```

### 3. Aceder à aplicação

- Frontend: `http://localhost:4173`
- Healthcheck da API: `http://localhost:4174/api/health`

### 4. Parar os contentores

```bash
docker compose down
```
