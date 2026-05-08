FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8765
EXPOSE 8765
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8765}"]
