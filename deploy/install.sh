#!/bin/bash
die () {
    echo >&2 "$@"
    exit 1
}

# to prevent mistakes (fool me once!...)
if [ "$HOSTNAME" == "www.devintently.com" ]; then
        die "Error: You cannot run this on www.devintently.com"
fi

# unzip to temp directory
sudo chmod 777 /var/www/html
rm -rf /var/www/html/*
tar -mzxvf ~/v0.9.60.7.tar.gz -C /var/www/html

# permissions
sudo chown -R apache:ec2-user /var/www/html
sudo chmod -R 775 /var/www/html

# swap the robots file
rm /var/www/html/robots.txt
mv /var/www/html/robots-prod.txt /var/www/html/robots.txt

# cleanup
rm ~/v0.9.60.7.tar.gz
