#!/bin/bash

export DOCKERHUB_USER=digitalemil
export DOCKERHUB_REPO=thesimplegym
export VERSION=0.0.1
export BASEIMAGE=node:12.13.0-alpine
export APP_DIR=/opt/app


#JS/node: Generate dockerfile with docker hub info 
cat > Dockerfile.tmp  << EOF
FROM $BASEIMAGE
COPY . /opt/app
ENV APPDIR=/opt/app
ENV DOCKERHUB_USER=$DOCKERHUB_USER
ENV DOCKERHUB_REPO=$DOCKERHUB_REPO
ENTRYPOINT node /opt/app/bin/www
EOF

cp Dockerfile.tmp microservice-ui/Dockerfile		
cd microservice-ui
docker build --platform=linux/amd64  -t $DOCKERHUB_USER/$DOCKERHUB_REPO:microservice-ui-v$VERSION .
docker push $DOCKERHUB_USER/$DOCKERHUB_REPO:microservice-ui-v$VERSION 
cd ..

cp Dockerfile.tmp microservice-messagelistener/Dockerfile
cd microservice-messagelistener
docker build   --platform=linux/amd64  -t $DOCKERHUB_USER/$DOCKERHUB_REPO:microservice-messagelistener-v$VERSION .
docker push $DOCKERHUB_USER/$DOCKERHUB_REPO:microservice-messagelistener-v$VERSION 
cd ..

cp Dockerfile.tmp microservice-messagetransformer/Dockerfile
cd microservice-messagetransformer
docker build   --platform=linux/amd64  -t $DOCKERHUB_USER/$DOCKERHUB_REPO:microservice-messagetransformer-v$VERSION .
docker push $DOCKERHUB_USER/$DOCKERHUB_REPO:microservice-messagetransformer-v$VERSION 
cd ..

cp Dockerfile.tmp microservice-messagevalidator/Dockerfile
cd microservice-messagevalidator
docker build   --platform=linux/amd64  -t $DOCKERHUB_USER/$DOCKERHUB_REPO:microservice-messagevalidator-v$VERSION .
docker push $DOCKERHUB_USER/$DOCKERHUB_REPO:microservice-messagevalidator-v$VERSION 
cd ..


cp Dockerfile.tmp microservice-gcploadgenerator/Dockerfile	
cd microservice-gcploadgenerator
docker build   --platform=linux/amd64  -t $DOCKERHUB_USER/$DOCKERHUB_REPO:microservice-gcploadgenerator-v$VERSION .
docker push $DOCKERHUB_USER/$DOCKERHUB_REPO:microservice-gcploadgenerator-v$VERSION 
cd ..

cp Dockerfile.tmp microservice-loadgenerator/Dockerfile	
cd microservice-loadgenerator
docker build   --platform=linux/amd64  -t $DOCKERHUB_USER/$DOCKERHUB_REPO:microservice-loadgenerator-v$VERSION .
docker push $DOCKERHUB_USER/$DOCKERHUB_REPO:microservice-loadgenerator-v$VERSION 
cd ..

cd microservice-pmmlevaluator
#export PATH=/Library/Java/JavaVirtualMachines/jdk1.8.0_241.jdk/Contents/Home/bin:$PATH
#export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk1.8.0_241.jdk/Contents/Home
#/Users/emil/apache-maven-3.6.3/bin/mvn package -DskipTests
mvn package -DskipTests
docker build   --platform=linux/amd64  -t $DOCKERHUB_USER/$DOCKERHUB_REPO:microservice-pmmlevaluator-v$VERSION .
docker push $DOCKERHUB_USER/$DOCKERHUB_REPO:microservice-pmmlevaluator-v$VERSION 
cd ..

rm Dockerfile.tmp
