FROM python:3.11-alpine

RUN apk add --no-cache \
    ffmpeg \
    curl \
    ca-certificates \
    unzip

RUN curl -fsSL https://deno.land/install.sh | sh

ENV PATH="/root/.deno/bin:${PATH}"

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ src/

EXPOSE 5012
CMD ["python", "src/main.py"]