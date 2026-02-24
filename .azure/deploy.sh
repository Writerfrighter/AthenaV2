#!/bin/bash
cd /home/site/wwwroot
pnpm install --prod --frozen-lockfile
pnpm build