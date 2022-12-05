import { trigger } from "./trigger.ts";

const mentionTrigger = {
  ...trigger,
  event: {
    event_type: "slack#/events/app_mention",
  },
};

export default mentionTrigger;
