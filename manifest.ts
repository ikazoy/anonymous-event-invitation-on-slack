import { Manifest } from "deno-slack-sdk/mod.ts";
import { CreateEventInvitationWorkflow } from "./workflows/CreateEventInvitationWorkflow.ts";
import { SendMessageToAdvertiseAnEvent } from "./functions/create_event_invitation/definition.ts";
import {
  ApplicationsDatastore,
  EventsDatastore,
} from "./datastore/definition.ts";

export default Manifest({
  name: "Pecorino",
  description: "ぺこりーの 気遣い不要で レッツご飯",
  icon: "assets/icon.png",
  datastores: [EventsDatastore, ApplicationsDatastore],
  workflows: [CreateEventInvitationWorkflow],
  functions: [SendMessageToAdvertiseAnEvent],
  outgoingDomains: [],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
    "app_mentions:read",
  ],
});
