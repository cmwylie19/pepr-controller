# Deploy CRD

```bash
kubectl create -f ../k8s/GatewayCRD.yaml
```

```bash
k create -f -<<EOF
apiVersion: pepr.dev/v1beta1
kind: Gateway
metadata:
  name: case-was-here
  namespace: default
spec:
  server:
    redirectPort: 80
    port: 8080 
  jwtAuth:
    secretKey: "secret"
  rateLimit:
    rate: 5
EOF
```

```bash
kubectl create -f -<<EOF
apiVersion: v1
kind: Pod
metadata:
  creationTimestamp: null
  labels:
    controller-proxy: case-was-here
  name: t
  namespace: default
spec:
  containers:
  - image: nginx
    name: t
    resources: {}
  dnsPolicy: ClusterFirst
  restartPolicy: Always
status: {}
EOF
```
