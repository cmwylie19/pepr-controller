import {
  Capability,
  Log,
  RegisterKind,
  a,
} from "pepr";
import { Gateway, GatewayAttributes } from "./lib/gateway"
import { K8sAPI, createContainer } from "./lib/kubernetes-api"
/**
 *  The Controler Capability demonstates how Pepr can watch and control resources.
 *  To test this capability follow the README.md file in the base of the application.
 */
export const Controller = new Capability({
  name: "controller",
  description: "Controller for edge gateway.",
  namespaces: [],
});

// Use the 'When' function to create a new Capability Action
const { When } = Controller;
const k8sAPI = new K8sAPI()

let proxies: GatewayAttributes = {}
RegisterKind(Gateway, {
  group: "pepr.dev",
  version: "v1beta1",
  kind: "Gateway",
});

When(Gateway)
.IsDeleted()
.Then(gw => { 
  // delete the gateway from the proxies object
  delete proxies[gw.Raw?.metadata?.name] 
})

When(Gateway)
  .IsCreatedOrUpdated()
  .Then(async gw => {
    Log.info("Saw a Gateway object ", JSON.stringify(gw, undefined, 2))

    // Add gw to the proxies object
    proxies[gw.Raw?.metadata?.name] = {
      server: gw.Raw?.spec?.server,
      jwtAuth: gw.Raw?.spec?.jwtAuth,
      rateLimit: gw.Raw?.spec?.rateLimit
    }
    // .watch could replace this as this could disrupt availability
    await k8sAPI.findAndDeletePods(gw.Raw?.metadata.namespace,"controller-proxy")
  })

When(a.Pod)
  .IsCreated()
  .Then(async pod => {
    if (pod.Raw?.metadata?.labels?.["controller-proxy"] !== undefined && proxies[pod.Raw?.metadata?.labels?.["controller-proxy"]] !== undefined) {
      pod.Raw?.spec?.containers.push(createContainer(proxies[pod.Raw?.metadata?.labels?.["controller-proxy"]]))
      await k8sAPI.createService(pod.Raw?.metadata?.name + "-proxy", pod.Raw?.metadata?.namespace, { "controller-proxy": pod.Raw?.metadata?.labels?.["controller-proxy"] }, proxies[pod.Raw?.metadata?.labels?.["controller-proxy"]].server.port)
    }

  })

