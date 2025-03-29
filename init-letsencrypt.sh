#!/bin/bash

# Default values
rsa_key_size=4096
data_path="./certbot"

# Usage function
usage() {
    echo "Usage: $0 -e email -d domain1 -d domain2 -d domain3 ..."
    exit 1
}

# Parse command-line options
domains=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        -e) email="$2"; shift 2 ;;
        -d) domains+=("$2"); shift 2 ;;
        *) usage ;;
    esac
done

# Validate input
if [ -z "$email" ] || [ ${#domains[@]} -eq 0 ]; then
    usage
fi

echo "=== STEP 1: Stop all services and clean up ==="
# Stop all services to ensure clean state
docker-compose down
rm -rf ${data_path}/conf/live/*
rm -rf ${data_path}/www/*

# Create necessary directories with proper permissions
echo "=== STEP 2: Create necessary directories ==="
mkdir -p ${data_path}/conf/live
mkdir -p ${data_path}/www/.well-known/acme-challenge
chmod -R 755 ${data_path}

# Create a test file in the acme-challenge directory
echo "=== STEP 3: Create test file ==="
echo "this is a test file" > ${data_path}/www/.well-known/acme-challenge/test.txt
chmod 644 ${data_path}/www/.well-known/acme-challenge/test.txt

# Create a standalone nginx configuration only for acme challenge
echo "=== STEP 4: Create standalone nginx configuration ==="
cat > ./nginx/conf.d/acme.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${domains[*]};

    # Disable all caching for acme-challenge
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires 0;

    # Root directory for acme challenge
    root /var/www/certbot;

    # Location for acme challenge
    location ~ /.well-known/acme-challenge/ {
        allow all;
        default_type "text/plain";
        try_files \$uri =404;
    }
}
EOF

# Start nginx only
echo "=== STEP 5: Start nginx and test access ==="
docker-compose up -d nginx

# Wait for nginx to start
echo "Waiting for nginx to start..."
sleep 10

# Test if nginx is serving the test file
echo "Testing if nginx is serving the test file..."
for domain in "${domains[@]}"; do
    echo "Testing $domain..."
    curl -v "http://$domain/.well-known/acme-challenge/test.txt" 2>&1 | grep "this is a test file"
    if [ $? -eq 0 ]; then
        echo "Success! $domain is correctly serving the test file"
    else
        echo "Failed! $domain is not serving the test file"
        echo "Let's check the nginx error logs:"
        docker-compose logs nginx
        echo ""
        echo "WARNING: Proceeding anyway, but certificate issuance might fail for $domain"
    fi
done

echo "=== STEP 6: Request certificates ==="
# Build the domain arguments string
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Request certificates for all domains in a SINGLE certificate
echo "Requesting a SINGLE certificate for ALL domains: ${domains[*]}"
docker-compose run --rm --entrypoint "\
  certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email $email \
  --server https://acme-v02.api.letsencrypt.org/directory \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  $domain_args" certbot

echo "=== STEP 7: Verify certificates ==="
# Check if certificates were issued
echo "Checking issued certificates..."
docker-compose run --rm --entrypoint "\
  ls -la /etc/letsencrypt/live/" certbot

echo "=== STEP 8: Set up nginx SSL configuration ==="
# Create nginx SSL configuration for each domain
for domain in "${domains[@]}"; do
    echo "Creating SSL configuration for $domain..."
    cat > ./nginx/conf.d/${domain}.conf << EOF
server {
    listen 80;
    server_name ${domain};
    location / {
        return 301 https://\$host\$request_uri;
    }

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}

server {
    listen 443 ssl;
    server_name ${domain};

    ssl_certificate /etc/letsencrypt/live/${domains[0]}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domains[0]}/privkey.pem;

    # Additional SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Your website configuration
    location / {
        proxy_pass http://backend:3000;  # Adjust this to your actual backend service
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF
done

echo "=== STEP 9: Clean up and restart ==="
# Remove the temporary configuration and restart nginx
rm ./nginx/conf.d/acme.conf
docker-compose restart nginx

echo "Done! SSL certificates have been issued and nginx configured for HTTPS."
echo ""
echo "Certificate files location: ./certbot/conf/live/${domains[0]}/"
echo "SSL configuration files: ./nginx/conf.d/<domain>.conf"
echo ""
echo "Your websites should now be accessible via HTTPS:"
for domain in "${domains[@]}"; do
    echo "https://$domain"
done