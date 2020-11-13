#!/bin/bash
PWD=$(pwd)
#mkdir
#mkdir kong
#cd kong
mkdir -p pgsql/data
touch pgsql/logfile

# clone repo
#git clone https://github.com/digitalemil/thesimplegym


# Install Postgres
sudo apt-get update
sudo apt-get install postgresql
sudo cp -r /etc/postgresql/13/main/* pgsql/data/
sudo chown -R $USER:$USER pgsql
chmod -R 777 pgsql
 
sudo su - postgres -c "export PATH=$PATH:/usr/lib/postgresql/13/bin; postgres -D $PWD/pgsql/data >$PWD/pgsql/logfile 2>&1 &kong"
sudo su - postgres -c "export PATH=$PATH:/usr/lib/postgresql/13/bin;psql -c \"CREATE USER kong;\""
sudo su - postgres -c "export PATH=$PATH:/usr/lib/postgresql/13/bin;psql -c \"ALTER ROLE kong PASSWORD 'kong';\""
sudo su - postgres -c "export PATH=$PATH:/usr/lib/postgresql/13/bin;createdb kong -O kong"

# Install Kong
sudo apt-get install -y apt-transport-https curl lsb-core
echo "deb https://kong.bintray.com/kong-deb `lsb_release -sc` main" | sudo tee -a /etc/apt/sources.list
curl -o bintray.key https://bintray.com/user/downloadSubjectPublicKey?username=bintray
sudo apt-key add bintray.key
sudo apt-get update
sudo apt-get install -y kong

sudo kong config -c $PWD/kong.conf init

sed 's#%KONGYML%#'"$PWD"'#g' kong.conf.template >kong.conf

sudo kong migrations bootstrap -c $PWD/kong.conf

sudo kong start -c $PWD/kong.conf


minikube start

cd ..
./install.sh
cd kong 

export TARGET=$(minikube -n thegym service ui | grep '\- http' | sed 's/.*http:\/\//''/g')
curl -i -X POST   --url http://localhost:8001/services/   --data 'name=thegym-service'   --data "url=http://$TARGET"
curl -i -X POST   --url http://localhost:8001/services/thegym-service/routes   --data 'paths[]=/'

echo Access the service on port 8000 on this cloud shell
