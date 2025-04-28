import clientPromise from "@/lib/mongodb";
import { AllServerStatus, DomainStatus, ServerStatus } from "@/page";

export async function GET(): Promise<Response> {
  try {
    const client = await clientPromise;
    const db = client.db("project-is-server-down");
    const collection = db.collection("website_checks");

    const data = await collection
      .aggregate([
        { $sort: { "metadata.name": 1, timestamp: -1 } },
        {
          $group: {
            _id: "$metadata.name",
            items: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 1,
            items: { $slice: ["$items", 30] },
          },
        },
        {
          $lookup: {
            from: "website_checks",
            let: { name: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$metadata.name", "$$name"] },
                      { $eq: ["$metadata.statusCode", 0] },
                    ],
                  },
                },
              },
              { $sort: { timestamp: -1 } },
              { $limit: 1 },
              { $project: { timestamp: 1, _id: 0 } },
            ],
            as: "latestStatusZero",
          },
        },
        {
          $addFields: {
            latestStatusZeroTimestamp: {
              $ifNull: [
                { $arrayElemAt: ["$latestStatusZero.timestamp", 0] },
                null,
              ],
            },
          },
        },
        {
          $project: {
            latestStatusZero: 0,
          },
        },
      ])
      .toArray();

    const res: AllServerStatus = {};
    for (const item of data) {
      const name = item._id;
      const lastDowntime: string = item.latestStatusZeroTimestamp;
      const history: ServerStatus[] = item.items.map((ele: any) => {
        return {
          timestamp: ele.timestamp,
          responseTimeMs:
            ele.metadata.statusCode === 0 ? 0 : ele.responseTimeMs,
        };
      });
      const isOnline: boolean = item.items[0].metadata.statusCode !== 0;
      const url: string = item.items[0].metadata.url;

      const domainStatus: DomainStatus = {
        lastDowntime,
        isOnline,
        history,
        url,
      };
      res[name] = domainStatus;
    }

    return Response.json(res satisfies AllServerStatus);
  } catch (error) {
    return Response.json({} satisfies AllServerStatus);
  }
}
