db = db.getSiblingDB("project-is-server-down");

// Create a time series collection
db.createCollection("website_checks", {
  timeseries: {
    timeField: "timestamp",
    metaField: "metadata",
    granularity: "minutes",
  },
  expireAfterSeconds: 60 * 60 * 24 * 60,
});

db.website_checks.createIndex(
  { timestamp: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 7,
    partialFilterExpression: {
      "metadata.statusCode": { $eq: 200 },
    },
  }
);

// Create compound indexes for better query performance
// Index for sorting and grouping by name and timestamp
db.website_checks.createIndex({ "metadata.name": 1, timestamp: -1 });

// Index for status code lookups
db.website_checks.createIndex({
  "metadata.name": 1,
  "metadata.statusCode": 1,
  timestamp: -1,
});

// Insert a sample document to verify the collection
// db.website_checks.insertOne({
//   timestamp: new Date(),
//   metadata: {
//     name: "example",
//     domain: "example.com",
//     statusCode: 200,
//   },
//   responseTimeMs: 124,
//   responseData: {},
//   errorMessage: null,
// });
