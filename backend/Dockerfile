# Multi-stage build para otimizar tamanho da imagem
FROM python:3.11-slim as builder

# Instalar dependências de build
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório para dependências
WORKDIR /app

# Copiar e instalar dependências
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Estágio de produção
FROM python:3.11-slim

# Instalar dependências de runtime
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Criar usuário não-root
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Definir diretório de trabalho
WORKDIR /app

# Copiar dependências do estágio builder
COPY --from=builder /root/.local /home/appuser/.local

# Copiar código da aplicação
COPY --chown=appuser:appuser . .

# Adicionar diretório local ao PATH
ENV PATH=/home/appuser/.local/bin:$PATH

# Criar diretórios necessários
RUN mkdir -p /app/logs && chown -R appuser:appuser /app

# Mudar para usuário não-root
USER appuser

# Expor porta
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Comando para iniciar a aplicação
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "info"]