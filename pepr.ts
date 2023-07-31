import { PeprModule } from "pepr";
import cfg from "./package.json";

import { Controller } from "./capabilities/controller";
//import { HelloPepr } from "./capabilities/hello-pepr";

new PeprModule(cfg, [Controller]);
