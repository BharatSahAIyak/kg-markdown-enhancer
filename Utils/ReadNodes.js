import neo4j from 'neo4j-driver';

const uri = 'bolt://localhost:7687';
const user = 'neo4j';
const password = 'testingInstance';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

export default async function readNodes() {
  const session = driver.session();
  try {
    const result = await session.run('MATCH (n) RETURN n ');
    return result.records.map(record => record.get('n').properties);
  } finally {
    await session.close();
  }
}
