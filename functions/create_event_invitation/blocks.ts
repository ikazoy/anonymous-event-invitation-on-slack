/**
 * Based on user-inputted data, assemble a Block Kit approval message for easy
 * parsing by the approving manager.
 */
import { APPLY_ID, DENY_ID } from "./constants.ts";
import { convertUnixTimestampSec } from "../../lib/datetime.ts";
import { Storage } from "../../backend/storage.ts";

// deno-lint-ignore no-explicit-any
export default function eventInvitationHeaderBlock(
  inputs: any,
  canReveal: boolean,
): any[] {
  const res = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:loud_sound:*お誘いがあります*:loud_sound:`,
      },
    },
    {
      "type": "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${
          canReveal
            ? `*主催者:* <@${inputs.host}>`
            : `*主催者:* 匿名（参加者の数が最少催行人数に達すると主催者と参加者が公開されます）`
        }`,
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
    {
      "type": "divider",
    },
  ];

  if (inputs.status === "cancelled") {
    res.map((block) => {
      if (block.type === "section" && block.text?.type === "mrkdwn") {
        block.text.text = `~${block.text.text}~`;
      }
    });
    res.unshift(cancelLabel);
  }

  return res;
}

const cancelLabel = {
  type: "section",
  text: {
    type: "mrkdwn",
    text: `:warning: このイベントはキャンセルされました :warning:`,
  },
};

const OverFlowMenu = (eventId: string) => {
  const generateValue = (operationName: string) => {
    return {
      operationName,
      eventId,
    };
  };
  return {
    "type": "overflow",
    "action_id": "more_operations",
    "options": [
      {
        "text": {
          "type": "plain_text",
          "emoji": true,
          "text": "参加を取りやめる",
        },
        "value": JSON.stringify(generateValue("cancel-application")),
      },
      {
        "text": {
          "type": "plain_text",
          "emoji": true,
          "text": "イベントをキャンセルする",
        },
        "value": JSON.stringify(generateValue("cancel-event")),
      },
      // {
      //   "text": {
      //     "type": "plain_text",
      //     "emoji": true,
      //     "text": "イベントを編集する",
      //   },
      //   "value": JSON.stringify(generateValue("edit-event")),
      // },
    ],
    confirm: {
      "title": {
        "type": "plain_text",
        "text": "確認",
      },
      "text": {
        "type": "mrkdwn",
        "text": "本当によろしいですか？",
      },
      "confirm": {
        "type": "plain_text",
        "text": "はい",
      },
      "deny": {
        "type": "plain_text",
        "text": "操作を中断する",
      },
    },
  };
};

export const labelForOccupied = (eventId: string) => {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*定員になりました*`,
    },
    accessory: OverFlowMenu(eventId),
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
      OverFlowMenu(eventId),
    ],
  };
};

export const generateMessage = async (
  token: string,
  eventUuid: string,
  inputs: any,
) => {
  // Update the advertisement message with the response to increment/decrement the number of participants
  // Nice little touch to prevent further interactions with the buttons
  // after capacity is full.
  const blockOfNumberOfParticipants = (numberOfParticipants: number) => {
    return {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `主催者含めて、${numberOfParticipants}人参加中`,
      },
    };
  };
  const numberOfParticipants = await Storage.getNumberOfApplications(
    token,
    eventUuid,
  );
  const blockOfParticipantsName = (participantsName: string[]) => {
    console.log(`participantsName:${participantsName}`);
    return participantsName.length > 0
      ? {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*参加者:* ${
            participantsName.map((pN) => {
              return `<@${pN}>`;
            }).concat(" ")
          }`,
        },
      }
      : null;
  };
  const userIdsOfParticipants = await Storage.getParticipantsOfEvent(
    token,
    eventUuid,
  );
  const event = await Storage.getEvent(token, eventUuid);
  console.log(`event:${JSON.stringify(event)}`);
  const canRevealParticipants = (
    event: Awaited<ReturnType<typeof Storage.getEvent>>,
    numberOfParticipants: number,
  ): boolean => {
    return !event.isAnonymous ||
      event.minimumNumberOfParticipants <= numberOfParticipants;
  };
  const canReveal = canRevealParticipants(event, numberOfParticipants);
  const blocks = eventInvitationHeaderBlock({
    ...inputs,
    status: event.status,
  }, canReveal);
  blocks.push(blockOfNumberOfParticipants(numberOfParticipants));
  if (canReveal) {
    blocks.push(blockOfParticipantsName(userIdsOfParticipants));
  }
  const isOccupied = event.maximumNumberOfParticipants <= numberOfParticipants;
  if (isOccupied) {
    blocks.push(labelForOccupied(eventUuid));
  } else if (event.status === "cancelled") {
    blocks.push(cancelLabel);
  } else {
    blocks.push(applicationButton(eventUuid));
  }

  console.log(`blocks to update: ${JSON.stringify(blocks)}`);
  return blocks;
};
