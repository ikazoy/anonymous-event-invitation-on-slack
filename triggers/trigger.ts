import { Trigger } from "deno-slack-api/types.ts";

export const trigger: Trigger = {
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
