#!/bin/bash
echo "Checking Heroku logs for admin login attempts..."
heroku logs --app react-fast-training --tail | grep -E "(admin/auth/login|BYPASS|403|Admin)"