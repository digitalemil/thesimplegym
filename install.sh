#!/bin/sh
export NAMESPACE=thegym

kubectl apply -f namespace.yaml

kubectl -n $NAMESPACE apply -f thesimplegym.yaml

#kubectl -n $NAMESPACE apply -f gaeimporter.yaml

