/**
 * Based on user-inputted data, assemble a Block Kit approval message for easy
 * parsing by the approving manager.
 */
import { APPLY_ID, DENY_ID } from "./constants.ts";
import { convertUnixTimestampSec } from "../../lib/datetime.ts";
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
        text: `${
          inputs.is_anonymous
            ? "*主催者:* :question:ミステリー:question:"
            : `*主催者:* <@${inputs.host}> `
        }
          `,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*日時:* ${convertUnixTimestampSec(inputs.start_date)}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*最少催行人数:* ${inputs.minimum_number_of_participants}名`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*定員:* ${
          inputs.maximum_number_of_participants
            ? `${inputs.maximum_number_of_participants}名`
            : "なし"
        }`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${inputs.description ? inputs.description : ""}`,
      },
    },
  ];
}

const OverFlowMenu = () => {
  return {
    "type": "overflow",
    "options": [
      {
        "text": {
          "type": "plain_text",
          "emoji": true,
          "text": "参加を取りやめる",
        },
        "value": "cancel-application",
      },
      {
        "text": {
          "type": "plain_text",
          "emoji": true,
          "text": "イベントをキャンセルする",
        },
        "value": "cancel-event",
      },
      {
        "text": {
          "type": "plain_text",
          "emoji": true,
          "text": "イベントを編集する",
        },
        "value": "edit-event",
      },
    ],
  };
};

export const labelForOccupied = () => {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*定員になりました*`,
    },
    accessory: OverFlowMenu(),
  };
};
export const applicationButton = (eventId: string) => {
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
      // TODO: add a block to show a modal for additional operations
      // e.g. for a host to cancel the event, for an applicant to cancel the application
      OverFlowMenu(),
    ],
  };
};
