#!/bin/bash
pip install -r requirements.txt
prisma generate
python -m prisma py fetch
prisma db push