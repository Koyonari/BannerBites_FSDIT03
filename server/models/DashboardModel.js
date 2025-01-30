const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const DashboardModel = {
  fetchAdAggregates: async () => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_AD_AGGREGATES,
    };
    const command = new ScanCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items || [];
  },
};

module.exports = DashboardModel;