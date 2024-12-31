#!/bin/bash
rm -rf /tmp/*
export TRANSFORMERS_CACHE="/opt/render/project/src/.cache/huggingface"
export SENTENCE_TRANSFORMERS_HOME="/opt/render/project/src/.cache/sentence-transformers"
pip install -r requirements.txt
prisma generate
python -m prisma py fetch
prisma db push
rm -rf /tmp/pip-*
rm -rf /root/.cache/pip
