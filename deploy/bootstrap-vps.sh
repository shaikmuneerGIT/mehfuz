#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu VPS. Run this once, as root, right
# after you first SSH in. It installs Docker, nginx, and a firewall, then
# clones the app and points you at the next step.
#
# Usage: ./bootstrap-vps.sh <your-github-repo-url>
#   e.g. ./bootstrap-vps.sh https://github.com/shaikmuneerGIT/mehfuz.git

set -euo pipefail

REPO_URL="${1:?Usage: $0 <git-repo-url>}"
APP_DIR="/opt/mehfuz"

echo "==> Updating system packages"
apt-get update -y
apt-get upgrade -y

echo "==> Installing Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

echo "==> Installing nginx, git, and a firewall"
apt-get install -y nginx git ufw

echo "==> Configuring the firewall (SSH, HTTP, HTTPS only)"
ufw allow OpenSSH
ufw allow "Nginx Full"
ufw --force enable

echo "==> Cloning the app to $APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  echo "    Already cloned — pulling latest instead."
  git -C "$APP_DIR" pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi

echo "==> Installing the nginx site config"
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/mehfuz
ln -sf /etc/nginx/sites-available/mehfuz /etc/nginx/sites-enabled/mehfuz
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

cat <<'EOF'

==> Base setup complete.

Next steps:
  1. cd /opt/mehfuz
  2. cp .env.production.example .env
  3. Edit .env — set JWT_SECRET (openssl rand -hex 48), ADMIN_EMAIL,
     ADMIN_PASSWORD, and CLIENT_ORIGIN.
  4. ./deploy/deploy.sh
  5. Visit http://<this-server's-IP> in a browser.

Once mehfuz.com's DNS points at this server, see the HTTPS section in
README.md to add a free certificate with certbot.
EOF
