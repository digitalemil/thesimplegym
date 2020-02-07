helm init

NAMESPACE=istio-system
kubectl create namespace $NAMESPACE
KIALI_USERNAME=$(echo -n kiali | base64)
KIALI_PASSPHRASE=$(echo -n kiali | base64)
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: kiali
  namespace: $NAMESPACE
  labels:
    app: kiali
type: Opaque
data:
  username: $KIALI_USERNAME
  passphrase: $KIALI_PASSPHRASE
EOF
cd ../istio

helm template --set kiali.enabled=true --set "kiali.dashboard.jaegerURL=http://jaeger-query:16686" --set "kiali.dashboard.grafanaURL=http://grafana:3000" --set grafana.enabled=true --set mixer.adapters.prometheus.enabled=true install/kubernetes/helm/istio-init --name istio-init --namespace istio-system | kubectl apply -f -
kubectl -n istio-system wait --for=condition=complete job --all

helm template --set kiali.enabled=true --set "kiali.dashboard.jaegerURL=http://jaeger-query:16686" --set "kiali.dashboard.grafanaURL=http://grafana:3000" --set grafana.enabled=true --set mixer.adapters.prometheus.enabled=true --namespace istio-system install/kubernetes/helm/istio > istio.yaml

kubectl apply -f istio.yaml


# run twice
#kubectl apply --selector knative.dev/crd-install=true \
#--filename https://github.com/knative/serving/releases/download/v0.12.0/serving.yaml \
#--filename https://github.com/knative/eventing/releases/download/v0.12.0/eventing.yaml \
#--filename https://github.com/knative/serving/releases/download/v0.12.0/monitoring.yaml
#kubectl apply --selector knative.dev/crd-install=true \
#--filename https://github.com/knative/serving/releases/download/v0.12.0/serving.yaml \
#--filename https://github.com/knative/eventing/releases/download/v0.12.0/eventing.yaml \
#--filename https://github.com/knative/serving/releases/download/v0.12.0/monitoring.yaml
#
#kubectl apply --filename https://github.com/knative/serving/releases/download/v0.12.0/serving.yaml \
#--filename https://github.com/knative/eventing/releases/download/v0.12.0/eventing.yaml \
#--filename https://github.com/knative/serving/releases/download/v0.12.0/monitoring.yaml

kubectl patch svc grafana --namespace istio-system -p '{"spec": {"type": "LoadBalancer"}}'
kubectl patch svc kiali --namespace istio-system -p '{"spec": {"type": "LoadBalancer"}}'

cd ../thesimplegym
kubectl apply -f metrics.yaml

#NAMESPACE=istio-system
#kubectl create namespace $NAMESPACE
#curl -H "Host: thegym-ui.thegym.example.com" http://35.238.18.224/
