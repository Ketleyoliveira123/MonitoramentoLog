# LogWatch

Ferramenta para **monitoramento e análise de logs de autenticação**, com foco na detecção de
possíveis ataques de **força bruta** (múltiplas tentativas de login malsucedidas a partir de um
mesmo IP).

O projeto tem três formas de uso, todas sobre o mesmo núcleo em Python:

| Componente | Tecnologia | Para quê |
|---|---|---|
| CLI | Python | Analisar o log e imprimir alertas no terminal |
| API | FastAPI | Expor os resultados da análise via HTTP |
| Dashboard | Next.js + React + TypeScript + Tailwind | Visualizar indicadores, alertas, eventos e IPs |

Tudo roda **localmente**, sem banco de dados e sem autenticação (primeira versão).

---

## Arquitetura

```
data/raw/auth.log
      │
      ▼
log_reader.py   → lê o arquivo e devolve as linhas brutas
log_parser.py   → converte cada linha em dados estruturados
analyzer.py     → conta LOGIN + FAILED por IP e marca suspeitos (limite padrão: 3)
alerts.py       → gera um alerta para cada IP suspeito
      │
      ▼
monitoring.py   → orquestra o pipeline, conta linhas inválidas e agrega indicadores
      │
      ├──► main.py  (CLI)
      └──► api.py   (FastAPI) ──HTTP──► frontend/ (Next.js)
```

O `monitoring.py` existe para que a CLI e a API usem **o mesmo fluxo**, sem duplicar lógica.
Nenhum dos dois contém regras de detecção próprias.

## Formato do log

```
AAAA-MM-DD HH:MM:SS NIVEL IP=x.x.x.x USER=usuario EVENT=EVENTO STATUS=STATUS
```

Exemplo:

```
2026-11-04 07:12:35 WARNING IP=192.168.1.15 USER=admin EVENT=LOGIN STATUS=FAILED
```

Linhas fora desse formato não interrompem a análise: são **contabilizadas** como inválidas e
informadas no dashboard. Linhas em branco são ignoradas.

## Regras de negócio

| Regra | Valor atual |
|---|---|
| Evento considerado | `EVENT=LOGIN` com `STATUS=FAILED` |
| Agrupamento | por endereço IP |
| Limite de detecção | 3 falhas (≥ 3 gera alerta) |
| Tipo do alerta | `BRUTE_FORCE` (força bruta) |
| Severidade | `WARNING` (exibida como "Aviso") |

**Classificação dos IPs** (tela "IPs monitorados"):

| Classificação | Critério |
|---|---|
| Suspeito | atingiu o limite de falhas (mesmo critério do alerta) |
| Atenção | teve ao menos uma falha, abaixo do limite |
| Normal | nenhuma falha |

**Limitações conhecidas** (evoluções futuras, ainda não implementadas):

- Não há janela de tempo: 3 falhas em segundos ou em dias geram o mesmo alerta.
- Não detecta falhas seguidas de login bem-sucedido (possível senha descoberta).
- Não detecta *password spraying* (um IP tentando vários usuários).
- Não existe regra para severidade `CRITICAL`; a interface já reserva o vermelho para ela.
- Usuários com `.` ou `-` no nome (ex.: `joao.silva`) não são reconhecidos pelo parser e
  entram na contagem de linhas inválidas.

## Estrutura

```
LogWatch/
├── data/raw/auth.log        # log de exemplo
├── src/
│   ├── log_reader.py        # leitura do arquivo
│   ├── log_parser.py        # interpretação das linhas
│   ├── analyzer.py          # regra de detecção
│   ├── alerts.py            # geração de alertas
│   ├── monitoring.py        # orquestração e indicadores
│   ├── schemas.py           # contratos de resposta da API
│   ├── api.py               # FastAPI
│   └── main.py              # CLI
├── tests/                   # pytest (unitários + API)
├── frontend/                # dashboard Next.js
│   ├── src/app/             # rotas: /, /alertas, /eventos, /ips
│   ├── src/views/           # conteúdo de cada tela
│   ├── src/components/      # cabeçalho, navegação, gráficos, tabelas, estados
│   ├── src/context/         # carregamento e atualização dos dados
│   ├── src/lib/api.ts       # camada de serviços (único ponto que conhece a API)
│   └── src/types/api.ts     # tipos das respostas
├── pyproject.toml
└── requirements.txt
```

---

## Requisitos

- Python 3.10+
- Node.js 20.9+ e npm

## Como iniciar localmente

São **dois serviços**, cada um em um terminal.

### 1. Backend (API)

```bash
cd LogWatch
python -m venv .venv

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
# Linux / macOS / Git Bash
source .venv/bin/activate

pip install -r requirements.txt
uvicorn api:app --app-dir src --reload
```

A API fica em **http://localhost:8000**. A documentação interativa (Swagger) fica em
http://localhost:8000/docs.

### 2. Frontend (dashboard)

```bash
cd LogWatch/frontend
npm install
cp .env.local.example .env.local   # Windows PowerShell: Copy-Item .env.local.example .env.local
npm run dev
```

Acesse **http://localhost:3000**. Os dados são atualizados a cada 30 segundos (com a aba
visível) ou pelo botão **Atualizar**.

### CLI (opcional)

```bash
python src/main.py
```

Saída esperada com o log de exemplo:

```
=== ALERTAS DE SEGURANÇA ===
[WARNING] IP: 192.168.1.15 - Possível tentativa de força bruta: 3 falhas de login.
[WARNING] IP: 192.168.1.30 - Possível tentativa de força bruta: 3 falhas de login.
```

> **Acentos corrompidos no terminal (ex.: `SEGURAN�A`)?** É a codificação do console do
> Windows. Use `PYTHONUTF8=1` (Git Bash) ou `$env:PYTHONUTF8=1` (PowerShell) antes do comando.

## Configuração

| Variável | Onde | Padrão | Descrição |
|---|---|---|---|
| `LOGWATCH_LOG_FILE` | backend | `data/raw/auth.log` | Arquivo de log analisado pela API e pela CLI |
| `LOGWATCH_CORS_ORIGINS` | backend | `http://localhost:3000,http://127.0.0.1:3000` | Origens que podem chamar a API pelo navegador |
| `NEXT_PUBLIC_API_URL` | frontend (`.env.local`) | `http://localhost:8000` | URL da API. É fixada no build: reinicie o `npm run dev` após alterar |

## API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Status da API e disponibilidade do arquivo de log |
| GET | `/api/dashboard` | Indicadores gerais, eventos por nível e tentativas por IP |
| GET | `/api/alerts` | Alertas, do mais recente para o mais antigo |
| GET | `/api/events` | Eventos interpretados, na ordem do arquivo |
| GET | `/api/ips` | IPs com contagens e classificação, ordenados por risco |

Respostas de erro:

| Situação | Status | Corpo |
|---|---|---|
| Arquivo de log inexistente | `503` | `{"detail": "Arquivo de log não encontrado."}` |
| Erro de leitura ou de codificação | `503` | `{"detail": "Não foi possível ler o arquivo de log."}` |
| Arquivo vazio | `200` | Indicadores zerados |

O `/health` continua respondendo `200` mesmo sem o log, com `log_file_available: false`. Assim
o dashboard diferencia "API fora do ar" de "log indisponível".

### Decisões de segurança

- **O caminho do log é definido só no servidor.** Nenhum endpoint aceita caminho de arquivo
  vindo do cliente, o que impede leitura de arquivos arbitrários (*path traversal*).
- **As mensagens de erro não expõem o caminho** do arquivo no servidor.
- **O CORS é restrito** ao frontend local e apenas ao método `GET`.
- **A API só faz leitura**: rotas de escrita retornam `405`.
- O uvicorn escuta em `127.0.0.1` por padrão, sem acesso pela rede.

## Testes e verificações

```bash
# Backend (na pasta LogWatch, com o .venv ativo)
pytest

# Frontend (na pasta LogWatch/frontend)
npx tsc --noEmit    # typecheck
npm run lint
npm run build
```

A suíte Python (43 testes) cobre: leitura de arquivo (existente, vazio, inexistente), parser,
regra de detecção (limite, limite customizado, múltiplos IPs, eventos ignorados, horários),
alertas, indicadores, classificação de IPs, contagem de linhas inválidas, CLI e todos os
endpoints da API, incluindo log vazio, log inexistente, CORS e tentativa de indicar outro
arquivo pela URL.
