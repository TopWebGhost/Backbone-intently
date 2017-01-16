#!/bin/bash
die () {
    echo >&2 "$@"
    exit 1
}

# check for args
[ "$#" -eq 4 ] || die "Usage: sh blastoff.sh <package.zip> <script.sh> <environment (\"QA\" or \"PROD\")> <version number>"
PACKAGEFILE=$1
SCRIPTFILE=$2
ENVIRONMENTNAME=$3
VERSIONNUM=$4

# begin in script folder
cd "$(dirname "$0")"

# verify environment
if [ "$ENVIRONMENTNAME" = "QA" ]; then
	S3BUCKETNAME="intently-qa-release"
	ELBNAME="intently-web-ui-qa"
elif [ "$ENVIRONMENTNAME" = "PROD" ]; then
	S3BUCKETNAME="intently-prod-release"
	ELBNAME="intently-web-ui-prod"
else
	die "Error: environment parameter must be \"QA\" or \"PROD\""
fi

# verify package file exists
if file --mime-type "$PACKAGEFILE" | grep -q application/x-gzip$; then
	echo "Package file $PACKAGEFILE verified"
else
	die "Error: Package file $PACKAGEFILE is not zipped"
fi

# verify script file exists
if file --mime-type "$SCRIPTFILE" | grep -q text/x-shellscript$; then
	echo "Script file $SCRIPTFILE verified"
else
	die "Error: Script file $SCRIPTFILE is not valid"
fi

# move files out of latest
echo "Moving files out of s3://$S3BUCKETNAME/web-ui/live"
for FOLDER in `aws s3 ls "s3://$S3BUCKETNAME/web-ui/live/" | awk '{print $2}' | cut -d '/' -f 1` ;
do
  aws s3 mv "s3://$S3BUCKETNAME/web-ui/live/$FOLDER" "s3://$S3BUCKETNAME/web-ui/old/$FOLDER" --recursive
done

# upload the files to S3 bucket
mkdir upload
mkdir "upload/$VERSIONNUM"
cp "$PACKAGEFILE" "upload/$VERSIONNUM"
cp "$SCRIPTFILE" "upload/$VERSIONNUM"
echo "Uploading files to S3 bucket \"$S3BUCKETNAME/web-ui/live/$VERSIONNUM\"..."
aws s3 cp upload "s3://$S3BUCKETNAME/web-ui/live/" --recursive || die "Error: Failed to upload $PACKAGEFILE to S3 folder \"$S3BUCKETNAME/web-ui/live/$VERSIONNUM\""
echo "Files uploaded to S3 folder \"$S3BUCKETNAME/web-ui/live/$VERSIONNUM\""
rm -r upload

# get list of EC2 instances registered to the load balancer
echo "Getting list of EC2 instances registered to ELB \"$ELBNAME\"..."
declare -a INSTANCEARRAY=()
INSTANCECOUNT=0
aws elb describe-instance-health --load-balancer-name "$ELBNAME" | \
while read ELBLINE
do
	# add the instance name to the array
	read -a ELBINSTANCE <<< $ELBLINE
	# get the private ip of the instance
	aws ec2 describe-instances --filters="Name=instance-id,Values=${ELBINSTANCE[2]}" | grep "NETWORKINTERFACES" | \
	while read INSTANCELINE
	do
		read -a EC2INSTANCE <<< $INSTANCELINE
		echo "Executing bootstrap script on instance \"${ELBINSTANCE[2]}\" with private IP \"${EC2INSTANCE[6]}\"..."
		# clear out any old deployment files
		ssh -t -t -i Admin.pem -o StrictHostKeyChecking=no ec2-user@${EC2INSTANCE[6]} "rm *.log; rm install.sh; sh bootstrap.sh $ENVIRONMENTNAME web-ui"
		if [ $? -eq 0 ]; then
			echo "... done!"
		else
			echo "... something went wrong :("
		fi
	done
done

echo "Launch completed! Onwards and upwards!"
