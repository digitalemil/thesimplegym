#!/bin/bash
export NAMESPACE=thegym
export PASSWORD=$(cat ../TheGymFrontEndWithPubSub/passwd.json | grep pass | awk '{ print $1 }' | sed 's/".*":"//' | sed 's/"//')

kubectl apply -f namespace.yaml

export PASSWORD

sed 's/%PASSWORD%/'"$PASSWORD"'/g' gcp-thesimplegym.yaml >thesimplegym.yaml.tmp

PASSWORD= # get rid of passwd
export PASSWORD

kubectl apply -n $NAMESPACE -f thesimplegym.yaml.tmp
rm thesimplegym.yaml.tmp

sleep 20

kubectl apply -n thegym -f knative-ui.yaml

kubectl -n thegym get route knative-thegym-ui

kubectl apply -f istio-gateway-ui.yaml

kubectl -n thegym apply -f se.yaml

export IP=$(kubectl get svc istio-ingressgateway --namespace istio-system | grep LoadBalancer | awk '{ print $4 }')

echo curl -H "Host: knative-thegym-ui.thegym.example.com" http://$IP

curl -H "Host: knative-thegym-ui.thegym.example.com" http://$IP


