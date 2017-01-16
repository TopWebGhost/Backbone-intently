#!/bin/bash
die () {
    echo >&2 "$@"
    exit 1
}

################################################################################
# LETS DO THIS
# TESTING GIT 1 MODIFIED
################################################################################
# GIT TEST 2 MODIFIED

[ "$#" -eq 1 ] || die "Usage: sh package.sh <version number>"
DESTINATIONFOLDER=$1

cd "$(dirname "$0")"
rm -rf "$DESTINATIONFOLDER"
mkdir "$DESTINATIONFOLDER"

################################################################################
# COPY THE SRC
################################################################################

cp -R /var/www/web-ui/src/* "$DESTINATIONFOLDER"

################################################################################
# REMOVE SOME THINGS
################################################################################

rm -rf "$DESTINATIONFOLDER/scss"
rm -rf "$DESTINATIONFOLDER/styleguide"
rm -rf "$DESTINATIONFOLDER/js/history.js-master"
rm -rf "$DESTINATIONFOLDER/.bowerrc"
rm -rf "$DESTINATIONFOLDER/bower.json"
rm -rf "$DESTINATIONFOLDER/config.rb"
rm -rf "$DESTINATIONFOLDER/stripe_integration_sandbox"

################################################################################
# BUST THAT CACHE
################################################################################

find $DESTINATIONFOLDER -name "*.html" -type f -exec sed -i "s/\.css\"/\.css?$DESTINATIONFOLDER\"/g" {} \;
find $DESTINATIONFOLDER -name "*.html" -type f -exec sed -i "s/\.js\"/\.js?$DESTINATIONFOLDER\"/g" {} \;
find $DESTINATIONFOLDER -name "*.html" -type f -exec sed -i "s/\.css'/\.css?$DESTINATIONFOLDER'/g" {} \;
find $DESTINATIONFOLDER -name "*.html" -type f -exec sed -i "s/\.js'/\.js?$DESTINATIONFOLDER'/g" {} \;

################################################################################
# GET THE HTACCESS
################################################################################

cp /var/www/web-ui/src/.htaccess "$DESTINATIONFOLDER"

################################################################################
# MINIFY THE JS
################################################################################

ls "$DESTINATIONFOLDER/js" | grep -v ".min.js" | grep -v "jquery." | while read SCRIPTFILE;
do
	echo "Minifying $SCRIPTFILE"
	java -jar ./yuicompressor-2.4.8.jar "$DESTINATIONFOLDER/js/$SCRIPTFILE" -o "$DESTINATIONFOLDER/js/$SCRIPTFILE"
done;

################################################################################
# MINIFY THE CSS
################################################################################

ls "$DESTINATIONFOLDER/styles" | while read STYLEFILE;
do
	echo "Minifying $STYLEFILE"
	java -jar ./yuicompressor-2.4.8.jar "$DESTINATIONFOLDER/styles/$STYLEFILE" -o "$DESTINATIONFOLDER/styles/$STYLEFILE"
done;

################################################################################
# PACKAGE IT UP
################################################################################

# go into folder and set owners
cd "$DESTINATIONFOLDER"
sudo chown -R apache:ec2-user *

# ...nice package!
tar -zcvf "$DESTINATIONFOLDER.tar.gz" ./* ./.[^.]*

# move the zip file up
mv "$DESTINATIONFOLDER.tar.gz" ..

# delete the folder
rm -rf "../$DESTINATIONFOLDER"

echo "Packaging completed, do not forget to update the install.sh script before blasting off!"
