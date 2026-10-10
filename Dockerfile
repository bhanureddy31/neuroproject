FROM node:24-bookworm

ENV PYTHONUNBUFFERED=1
ENV PYTHON_EXECUTABLE=python3
ENV PORT=3000

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY packages/Parkinson_Deployment_Package/requirements.txt /tmp/parkinson-requirements.txt
COPY packages/Experiment_10_Alzheimer_Inference_Package/requirements.txt /tmp/alzheimer-requirements.txt

RUN python3 -m venv /opt/neuro-venv \
    && /opt/neuro-venv/bin/pip install --upgrade pip \
    && /opt/neuro-venv/bin/pip install -r /tmp/parkinson-requirements.txt \
    && /opt/neuro-venv/bin/pip install -r /tmp/alzheimer-requirements.txt

ENV PATH="/opt/neuro-venv/bin:${PATH}"
ENV PYTHON_EXECUTABLE=/opt/neuro-venv/bin/python

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
