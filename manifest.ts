import { Manifest } from "deno-slack-sdk/mod.ts";
import { CreateTimeOffRequestWorkflow } from "./workflows/CreateTimeOffRequestWorkflow.ts";
import { SendMessageToAdvertiseAnEvent } from "./functions/send_time_off_request_to_manager/definition.ts";
import {
  ApplicationsDatastore,
  EventsDatastore,
} from "./datastore/definition.ts";

export default Manifest({
  name: "focused-gorilla-402",
  description: "Ask your manager for some time off",
  icon: "assets/default_new_app_icon.png",
  datastores: [EventsDatastore, ApplicationsDatastore],
  workflows: [CreateTimeOffRequestWorkflow],
  functions: [SendMessageToAdvertiseAnEvent],
  outgoingDomains: [],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
  ],
});
