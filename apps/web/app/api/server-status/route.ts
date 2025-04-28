import clientPromise from "@/lib/mongodb";

export async function GET() {
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
      ])
      .toArray();

    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: JSON.stringify(error) }, { status: 500 });
  }
}
