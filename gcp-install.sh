#!/bin/bash
export NAMESPACE=thegym

kubectl apply -f namespace.yaml

echo -n "PASSWORD: "; stty -echo; read PASSWORD; stty echo; echo
export PASSWORD

sed 's/%PASSWORD%/'"$PASSWORD"'/g' gcp-thesimplegym.yaml >thesimplegym.yaml.tmp

PASSWORD= # get rid of passwd
export PASSWORD

kubectl apply -n $NAMESPACE -f thesimplegym.yaml.tmp
rm thesimplegym.yaml.tmp

kubectl apply -n thegym -f knative-ui.yaml

kubectl -n thegym get route thegym-ui

kubectl apply -f istio-gateway-ui.yaml

kubectl get svc istio-ingressgateway --namespace istio-system


