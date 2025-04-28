db = db.getSiblingDB("project-is-server-down");

// Create a time series collection
db.createCollection("website_checks", {
  timeseries: {
    timeField: "timestamp",
    metaField: "metadata",
    granularity: "minutes",
  },
  expireAfterSeconds: 60 * 60 * 24 * 90,
});

// Create indexes for better query performance
db.website_checks.createIndex({ "metadata.name": 1 });
db.website_checks.createIndex({ timestamp: 1 });

// Insert a sample document to verify the collection
db.website_checks.insertOne({
  timestamp: new Date(),
  metadata: {
    name: "example",
    domain: "example.com",
    statusCode: 200,
  },
  responseTimeMs: 124,
  responseData: {},
  errorMessage: null,
});
