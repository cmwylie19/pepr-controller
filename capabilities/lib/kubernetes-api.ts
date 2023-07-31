import { Log } from "pepr";
import {
  AppsV1Api,
  CoreV1Api,
  KubeConfig,
  V1Secret,
  PatchUtils,
  V1Container
} from "@kubernetes/client-node";


import { GatewayBody } from "./gateway";

export const createContainer = (gw: GatewayBody): V1Container => ({
  image: "cmwylie19/edge-proxy:0.0.1",
  name: "proxy",
  command: ["./edge-gateway", "serve", "-r", JSON.stringify(gw.server?.redirectPort), "-p", JSON.stringify(gw.server?.port), "rateLimit", "--rate", JSON.stringify(gw.rateLimit?.rate), "jwt", "-s", gw.jwtAuth.secretKey]
})

export class K8sAPI {
  k8sApi: CoreV1Api;

  constructor() {
    const kc = new KubeConfig();
    kc.loadFromDefault();
    this.k8sApi = kc.makeApiClient(CoreV1Api);
  }

  // Function to create a Kubernetes service
  async createService(name, namespace, labels, port) {

    try {
      const serviceObject = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name,
          namespace,
          labels,
        },
        spec: {
          selector: labels,
          ports: [
            {
              port: port,
              targetPort: port,
            },
          ],
          type: 'ClusterIP', // Change this to 'NodePort' or 'LoadBalancer' if needed
        },
      };

      // Create the service
      const response = await this.k8sApi.createNamespacedService(namespace, serviceObject);

      console.log(`Service "${response.body.metadata.name}" in namespace "${response.body.metadata.namespace}" created successfully.`);
    } catch (error) {
      console.error('Error creating service:', error);
    }
  }

  async findAndDeletePods(namespace, label) {

    try {
   
      const response = await this.k8sApi.listPodForAllNamespaces(namespace, undefined, undefined, undefined, undefined, undefined, undefined, undefined, label);
      response.body.items.map(async po => {
        await this.k8sApi.deleteNamespacedPod(po.metadata?.name, po.metadata?.namespace, undefined, undefined, undefined, undefined, undefined, {
          propagationPolicy: 'Foreground',
          gracePeriodSeconds: 0, // Delete immediately
        });
      })
    } catch (err) {
      console.error('Error fetching pods:', err);
    }
  }
}
