FROM python:3.10

WORKDIR /app

# انسخ فقط الباك اند
COPY ml-api ./ml-api

WORKDIR /app/ml-api

RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]