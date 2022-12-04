/**
 * Based on user-inputted data, assemble a Block Kit approval message for easy
 * parsing by the approving manager.
 */
import { APPLY_ID, DENY_ID } from "./constants.ts";
// deno-lint-ignore no-explicit-any
export default function timeOffRequestHeaderBlocks(inputs: any): any[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `お誘いがあります`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*From:* <@${inputs.employee}>`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Dates:* ${inputs.start_date} to ${inputs.end_date}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Reason:* ${inputs.reason ? inputs.reason : "N/A"}`,
      },
    },
  ];
}

export const allowButton = (eventId: string, disabled: boolean = true) => {
  return {
    "type": "actions",
    "block_id": "approve-deny-buttons",
    "elements": [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "参加",
        },
        action_id: APPLY_ID, // <-- important! we will differentiate between buttons using these IDs
        style: "primary",
        value: eventId,
      },
    ],
  };
};
