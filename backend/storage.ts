import { SlackAPI } from "deno-slack-api/mod.ts";
import { Application, Event } from "./interfaces.ts";
import {
  ApplicationsDatastore,
  EventsDatastore,
} from "../datastore/definition.ts";

export class Storage {
  static getEvent = async (
    token: string,
    id: string,
  ): Promise<Event> => {
    // console.log(
    //   `Executing getSettings(token: ${token}, channel_id: ${channel_id})`,
    // );
    const client = SlackAPI(token, {});
    const get_response = await client.apps.datastore.get<
      typeof EventsDatastore.definition
    >({
      datastore: "events",
      id,
    });

    if (!get_response.ok) {
      console.log(`Error calling apps.datastore.get: ${get_response.error}`);
      throw new Error(get_response.error);
    }

    console.log(`Event retrieved: ${JSON.stringify(get_response)}`);
    return get_response.item;
  };

  static setEvent = async (
    token: string,
    event: Event,
  ) => {
    const client = SlackAPI(token, {});
    console.log(
      `Executing setEvent(token: ${token}, event: ${JSON.stringify(event)})`,
    );
    const put_response = await client.apps.datastore.put<
      typeof EventsDatastore.definition
    >({
      datastore: "events",
      item: event,
    });

    if (!put_response.ok) {
      console.log(`Error calling apps.datastore.put: ${put_response.error}`);
      throw new Error(put_response.error);
    }
  };

  static cancelEvent = async (
    token: string,
    eventUuid: string,
  ) => {
    const event = await Storage.getEvent(token, eventUuid);
    event.status = "cancelled";
    await Storage.setEvent(token, event);
  };

  static getParticipantsOfEvent = async (
    token: string,
    eventUuid: string,
  ): Promise<string[]> => {
    const client = SlackAPI(token, {});
    console.log(`eventUuid: ${eventUuid}`);
    const get_response = await client.apps.datastore.query({
      datastore: "applications",
      expression: "#eventId = :eventId and #status = :status",
      expression_attributes: { "#eventId": "eventId", "#status": "status" },
      expression_values: { ":eventId": eventUuid, ":status": "accepted" },
    });

    console.log(`get_response: ${JSON.stringify(get_response)}`);

    if (!get_response.ok) {
      console.log(
        `Error calling apps.datastore.get: ${get_response.error}`,
      );
      throw new Error(get_response.error);
    }
    console.log(`Applications retrieved: ${JSON.stringify(get_response)}`);
    return get_response.items.map((item) => item.applicant);
  };

  static getNumberOfApplications = async (
    token: string,
    eventUuid: string,
  ): Promise<number> => {
    console.log(
      `Executing getNumberOfApplications(token: ${token}, eventUuid: ${eventUuid})`,
    );

    return (await this.getParticipantsOfEvent(token, eventUuid)).length;
  };

  static getApplication = async (
    token: string,
    eventUuid: string,
    userId: string,
  ): Promise<Application> => {
    const client = SlackAPI(token, {});

    const get_response = await client.apps.datastore.query<
      typeof ApplicationsDatastore.definition
    >({
      datastore: "applications",
      expression: "#eventId = :eventId and #applicant = :applicant",
      expression_attributes: {
        "#eventId": "eventId",
        "#applicant": "applicant",
      },
      expression_values: { ":eventId": eventUuid, ":applicant": userId },
    });

    if (!get_response.ok) {
      console.log(`Error calling apps.datastore.get: ${get_response.error}`);
      throw new Error(get_response.error);
    }

    console.log(`Application retrieved: ${JSON.stringify(get_response)}`);
    return get_response.items[0];
  };

  static setApplication = async (
    token: string,
    application: Application,
  ) => {
    console.log(
      `Executing setApplication(token: ${token}, application: ${
        JSON.stringify(application)
      })`,
    );
    const client = SlackAPI(token, {});
    const put_response = await client.apps.datastore.put({
      datastore: "applications",
      item: application,
    });

    if (!put_response.ok) {
      console.log(`Error calling apps.datastore.put: ${put_response.error}`);
      throw new Error(put_response.error);
    }
  };

  static cancelApplication = async (
    token: string,
    eventUuid: string,
    userId: string,
  ) => {
    const application = await Storage.getApplication(token, eventUuid, userId);
    application.status = "cancelled";
    await Storage.setApplication(token, application);
  };

  static removeSubscription = async (
    token: string,
    subscription: Subscription,
  ) => {
    // console.log(
    //   `Executing removeSubscription(token: ${token}, subscription: ${
    //     JSON.stringify(subscription)
    //   })`,
    // );
    if (subscription.id != null) {
      const client = SlackAPI(token, {});
      const delete_response = await client.apps.datastore.delete({
        datastore: "subscriptions_datastore",
        id: subscription.id,
      });

      if (!delete_response.ok) {
        console.log(
          `Error calling apps.datastore.delete: ${delete_response.error}`,
        );
        throw new Error(delete_response.error);
      }
    } else {
      console.log(
        "The subscription cannot be deleted as its missing its identifier.",
      );
      throw new Error("The subscription cannot be deleted.");
    }
  };

  static getObjectDescribe = async (
    token: string,
    channel_id: string,
    sobject: string,
  ): Promise<ObjectDescribe> => {
    // console.log(
    //   `Executing getObjectDescribe(token: ${token}, channel_id: ${channel_id}, sobject: ${sobject})`,
    // );
    const client = SlackAPI(token, {});
    const get_response = await client.apps.datastore.get({
      datastore: "object_describe_datastore",
      id: channel_id.toLowerCase() + "___" + sobject.toLowerCase(),
    });

    if (!get_response.ok) {
      console.log(`Error calling apps.datastore.get: ${get_response.error}`);
      throw new Error(get_response.error);
    }

    // console.log(`ObjectDescribe retrieved: ${JSON.stringify(get_response)}`);
    return <ObjectDescribe> JSON.parse(get_response.item.describe);
  };

  static setObjectDescribe = async (
    token: string,
    channel_id: string,
    object_describe: ObjectDescribe,
  ) => {
    // console.log(
    //   `Executing setObjectDescribe(token: ${token}, channel_id: ${channel_id}, object_describe: ${JSON.stringify(object_describe)})`,
    // );
    const client = SlackAPI(token, {});
    const put_response = await client.apps.datastore.put({
      datastore: "object_describe_datastore",
      item: {
        id: channel_id.toLowerCase() + "___" +
          object_describe.name.toLowerCase(),
        channel_id: channel_id,
        sobject: object_describe.name,
        describe: JSON.stringify(object_describe),
      },
    });

    if (!put_response.ok) {
      console.log(`Error calling apps.datastore.put: ${put_response.error}`);
      throw new Error(put_response.error);
    }
  };
}
