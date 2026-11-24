# LogWatch

Ferramenta em Python para **monitoramento e análise de logs de autenticação**, com foco na
detecção de possíveis ataques de **força bruta** (múltiplas tentativas de login malsucedidas
a partir de um mesmo IP).

> Projeto de estudo em evolução. Próxima etapa planejada: API em FastAPI + dashboard em Next.js.

## Como funciona

O processamento é um pipeline de quatro etapas, cada uma em um módulo com uma única responsabilidade:

```
data/raw/auth.log
      │
      ▼
log_reader.py   → lê o arquivo e devolve as linhas brutas
      │
      ▼
log_parser.py   → converte cada linha em um dicionário (data, hora, nível, IP, usuário, evento, status)
      │            linhas fora do formato são descartadas
      ▼
analyzer.py     → conta LOGIN + FAILED por IP e marca como suspeito quem atingir o limite (padrão: 3)
      │
      ▼
alerts.py       → gera um alerta (severidade, IP, mensagem) para cada IP suspeito
      │
      ▼
main.py         → orquestra o pipeline e imprime os alertas
```

## Formato do log

Cada linha deve seguir o padrão:

```
AAAA-MM-DD HH:MM:SS NIVEL IP=x.x.x.x USER=usuario EVENT=EVENTO STATUS=STATUS
```

Exemplo:

```
2026-11-04 07:12:35 WARNING IP=192.168.1.15 USER=admin EVENT=LOGIN STATUS=FAILED
```

## Regra de detecção

| Regra | Valor atual |
|---|---|
| Evento considerado | `EVENT=LOGIN` com `STATUS=FAILED` |
| Agrupamento | por endereço IP |
| Limite (`threshold`) | 3 falhas (≥ 3 gera alerta) |
| Severidade do alerta | `WARNING` |

**Limitações conhecidas** (pontos de evolução, ainda não implementados):

- Não há janela de tempo: 3 falhas em segundos ou em dias geram o mesmo alerta.
- Não detecta falhas seguidas de login bem-sucedido (possível senha descoberta).
- Não detecta *password spraying* (um IP tentando vários usuários).
- Linhas fora do formato (ex.: `USER=joao.silva`) são descartadas sem aviso.

## Estrutura

```
LogWatch/
├── data/raw/auth.log     # log de exemplo
├── src/                  # código-fonte
│   ├── log_reader.py
│   ├── log_parser.py
│   ├── analyzer.py
│   ├── alerts.py
│   └── main.py
├── tests/                # testes automatizados (pytest)
├── pyproject.toml        # configuração do pytest
└── requirements.txt
```

## Requisitos

- Python 3.10 ou superior

## Instalação

```bash
cd LogWatch
python -m venv .venv

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
# Linux / macOS / Git Bash
source .venv/bin/activate

pip install -r requirements.txt
```

## Execução

```bash
python src/main.py
```

O caminho do log é calculado a partir da localização do código, então o comando funciona
a partir de qualquer pasta. Saída esperada com o log de exemplo:

```
=== ALERTAS DE SEGURANÇA ===
[WARNING] IP: 192.168.1.15 - Possível tentativa de força bruta: 3 falhas de login.
[WARNING] IP: 192.168.1.30 - Possível tentativa de força bruta: 3 falhas de login.
```

> **Acentos corrompidos no terminal (ex.: `SEGURAN�A`)?** É a codificação do console do
> Windows, não do programa. Execute com `PYTHONUTF8=1` (Git Bash) ou
> `$env:PYTHONUTF8=1` (PowerShell) antes do comando.

## Testes

```bash
pytest
```

A configuração em `pyproject.toml` adiciona `src/` ao caminho de importação, então tanto
`pytest` quanto `python -m pytest` funcionam.

Cobertura atual: leitura de arquivo (existente, vazio, inexistente), parser (linha válida e
inválida), analisador (limite, limite customizado, múltiplos IPs, eventos ignorados),
geração de alertas e execução do `main`.
