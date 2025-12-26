const { SessionsClient } = require('@google-cloud/dialogflow');

async function testDialogflow() {
  try {
    const client = new SessionsClient();
    const projectId = await client.getProjectId();
    console.log("Authenticated with project:", projectId);
  } catch (err) {
    console.error("Auth test failed:", err.message);
    console.error("Full error:", err);
  }
}

testDialogflow();