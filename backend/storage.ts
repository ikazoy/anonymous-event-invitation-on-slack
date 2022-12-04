import { SlackAPI } from "deno-slack-api/mod.ts";
import { Application, Event } from "./interfaces.ts";
import { EventsDatastore } from "../datastore/definition.ts";

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

  static getSubscriptions = async (
    token: string,
    channel_id: string,
  ): Promise<Subscription[]> => {
    // console.log(
    //   `Executing getSubscriptions(token: ${token}, channel_id: ${channel_id})`,
    // );
    const client = SlackAPI(token, {});
    const query_response = await client.apps.datastore.query({
      datastore: "subscriptions_datastore",
      expression: "#channel_id = :channel_id",
      expression_attributes: { "#channel_id": "channel_id" },
      expression_values: { ":channel_id": channel_id },
    });

    if (!query_response.ok) {
      console.log(
        `Error calling apps.datastore.query: ${query_response.error}`,
      );
      throw new Error(query_response.error);
    }

    // console.log(`Subscriptions retrieved: ${JSON.stringify(query_response)}`);
    const subscriptions: Subscription[] = [];
    if (query_response.items != null && query_response.items.length > 0) {
      for (let x = 0; x < query_response.items.length; x++) {
        subscriptions.push({
          id: query_response.items[x].id,
          channel_id: query_response.items[x].channel_id,
          sobject: query_response.items[x].sobject,
          filters: [], //JSON.parse(query_response.items[x].filters),
        });
      }
    }
    return subscriptions;
  };

  static getParticipantsOfEvent = async (
    token: string,
    eventUuid: string,
  ): Promise<string[]> => {
    const client = SlackAPI(token, {});
    console.log(`eventUuid: ${eventUuid}`);
    const get_response = await client.apps.datastore.query({
      datastore: "applications",
      expression: "#eventId = :eventId",
      expression_attributes: { "#eventId": "eventId" },
      expression_values: { ":eventId": eventUuid },
    });

    const get_response2 = await client.apps.datastore.query({
      datastore: "applications",
    });
    console.log(`get_response: ${JSON.stringify(get_response)}`);
    console.log(`get_response2: ${JSON.stringify(get_response2)}`);

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