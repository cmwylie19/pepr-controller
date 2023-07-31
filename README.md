# Deploy CRD

Create the Gateway CRD  

```bash
kubectl create -f k8s/GatewayCRD.yaml
```

Create the operand with rateLimiting and jwtAuthentication

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

Create a pod with label for the case-was-here operand 

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
    ports:
    - containerPort: 80
  dnsPolicy: ClusterFirst
  restartPolicy: Always
status: {}
EOF
```

Create the curler 

```bash
k run curler --image=nginx
```

Query against the proxy (token is created for arm mac, compile it for your system)

```bash
k exec -it curler -- curl -L -H "Authorization: Bearer $(./token 88 secret)" t-proxy:8080
```

Hit the rate limit

```bash
for s in $(seq 33); do 
k exec -it curler -- curl -L -H "Authorization: Bearer $(./token 88 secret)" t-proxy:8080
done | grep "exceeded"
```

output

```json
{"message":"rate limit exceeded"}
{"message":"rate limit exceeded"}
{"message":"rate limit exceeded"}
{"message":"rate limit exceeded"}
{"message":"rate limit exceeded"}
{"message":"rate limit exceeded"}
{"message":"rate limit exceeded"}
{"message":"rate limit exceeded"}
{"message":"rate limit exceeded"}
{"message":"rate limit exceeded"}
{"message":"rate limit exceeded"}
{"message":"rate limit exceeded"}
{"message":"rate limit exceeded"}
{"message":"rate limit exceeded"}
{"message":"rate limit exceeded"}
{"message":"rate limit exceeded"}
```

Curl without JWT

```bash
k exec -it curler -- curl -L t-proxy:8080
```

output
```json
{"message":"missing or malformed jwt"}
```
