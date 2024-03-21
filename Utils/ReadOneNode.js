import neo4j from 'neo4j-driver';

async function readOneNode(nodeName) {
  const uri = 'bolt://localhost:7687';
  const user = 'neo4j';
  const password = 'testingInstance';
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH (n {name: $nodeName})-[r]-(m) RETURN n, r, m`,
      { nodeName }
    );
    const records = result.records.map(record => ({
      node: record.get('n').properties,
      relationship: record.get('r').properties,
      connectedNode: record.get('m').properties
    }));
    return records;
  } finally {
    await session.close();
    await driver.close();
  }
}

export default readOneNode;
