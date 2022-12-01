import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { SendMessageToAdvertiseAnEvent } from "../functions/send_time_off_request_to_manager/definition.ts";

/**
 * A Workflow composed of two steps: asking for time off details from the user
 * that started the workflow, and then forwarding the details along with two
 * buttons (approve and deny) to the user's manager.
 */
export const CreateTimeOffRequestWorkflow = DefineWorkflow({
  callback_id: "create_time_off",
  title: "Request Time Off",
  description:
    "Create a time off request and send it for approval to your manager",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
    },
    required: ["interactivity"],
  },
});

// Step 1: opening a form for the user to create an event
const formData = CreateTimeOffRequestWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "ランチ募集",
    interactivity: CreateTimeOffRequestWorkflow.inputs.interactivity,
    submit_label: "募集開始！",
    description: "お誘いを送ります",
    fields: {
      required: ["channel", "start_date", "description"],
      elements: [
        {
          name: "channel",
          title: "募集するチャンネル",
          type: Schema.slack.types.channel_id,
        },
        {
          name: "start_date",
          title: "開始日",
          type: "slack#/types/timestamp",
        },
        {
          name: "description",
          title: "説明",
          default: "ランチ行こう！",
          long: true,
          type: Schema.types.string,
        },
        {
          name: "is_anonymous",
          title: "匿名で募集する",
          type: Schema.types.boolean,
          default: true,
        },
      ],
    },
  },
);

// Step 2: send time off request details along with approve/deny buttons to manager
CreateTimeOffRequestWorkflow.addStep(SendMessageToAdvertiseAnEvent, {
  interactivity: formData.outputs.interactivity,
  // we can get user who make an action to a button
  host: CreateTimeOffRequestWorkflow.inputs.interactivity.interactor.id,
  channel: formData.outputs.fields.channel,
  description: formData.outputs.fields.description,
  start_date: formData.outputs.fields.start_date,
  is_anonymous: formData.outputs.fields.is_anonymous,
});
