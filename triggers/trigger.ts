import { Trigger } from "deno-slack-api/types.ts";
import { CreateEventInvitationWorkflow } from "../workflows/CreateEventInvitationWorkflow.ts";

export const trigger: Trigger<typeof CreateEventInvitationWorkflow.definition> =
  {
    type: "shortcut",
    name: "ぺこりーの イベント作成",
    description: "イベントを作成して、参加者を募集できます。",
    workflow: "#/workflows/create_event",
    inputs: {
      interactivity: {
        value: "{{data.interactivity}}",
      },
    },
  };

export default trigger;
