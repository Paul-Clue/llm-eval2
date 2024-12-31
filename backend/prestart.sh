#!/bin/bash
pip install -r requirements.txt
rm -rf /tmp/*
prisma generate
python -m prisma py fetch
prisma db push
