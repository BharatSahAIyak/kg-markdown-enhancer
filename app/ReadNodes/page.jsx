"use client"
import { useEffect, useState } from 'react';
import readNodes from '../../Utils/ReadNodes.js';
import NeoVis from 'neovis.js'; 
import neo4j from 'neo4j-driver';

export default function Neo4jPage() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  let viz; // Declare viz variable
  const uri = 'bolt://localhost:7687';
  const user = 'neo4j';
  const password = 'testingInstance';
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await readNodes();
        setNodes(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching nodes:', error);
        setLoading(false);
      }
    }
    fetchData();
    const session = driver.session();
    subscribeToChanges(); // Start subscription
    return () => {
      // Clean up subscription when component unmounts
      if (session) {
        session.close();
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && nodes.length > 0) {
      renderVisualization(nodes);
    }
  }, [loading, nodes]);
  async function subscribeToChanges() {
    try {
      await session.run('CALL dbms.queryJmx("org.neo4j:instance=kernel#0,name=Kernel")'); // Ensures the session is active
      session.subscribe("MATCH (n) RETURN n", {
        onNext: async (record) => {
          const data = await readNodes(); // Fetch updated nodes
          setNodes(data); // Update state with updated nodes
        },
        onError: (error) => {
          console.error('Subscription error:', error);
        },
      });
    } catch (error) {
      console.error('Error subscribing to changes:', error);
    }
  }
  async function renderVisualization(data) {
    try {
      const config = {
        containerId: "viz",
        neo4j: {
          serverUrl: "bolt://localhost:7687",
          serverUser: "neo4j",
          serverPassword: "testingInstance",
        },
        labels: {
          Character: {
            label: "name",
            value: "age",
            title: (node) => {
              return `${node.properties.name} - Age: ${node.properties.age}`;
            }
          }
        },
        relationships: {
          KNOWS: {
            caption: false,
            thickness: "weight"
          }
        },
        initialCypher: "MATCH (n)-[r:KNOWS]->(m) RETURN n,r,m LIMIT 100"
      };

      viz = new NeoVis(config);
      viz.render(); // Render the visualization

      // Add event listener for zoom
      const container = document.getElementById("viz");
      container.addEventListener('wheel', handleZoom);

    } catch (error) {
      console.error('Error rendering visualization:', error);
    }
  }

  // Event handler for zooming
  function handleZoom(event) {
    if (viz) {
      const scaleFactor = 0.1; // Adjust the scale factor as needed
      const delta = event.deltaY || event.detail || event.wheelDelta;

      if (delta > 0) {
        viz.zoom(viz.getScale() - scaleFactor);
      } else {
        viz.zoom(viz.getScale() + scaleFactor);
      }
    }
  }

  return (
    <div>
      <h1>Neo4j Visualization</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div id="viz" style={{ width: '100%', height: '500px' }}></div>
      )}
      <ul>
        {nodes.map((node, index) => (
          <li key={index}>{JSON.stringify(node)}</li>
        ))}
      </ul>
    </div>
  );
}
