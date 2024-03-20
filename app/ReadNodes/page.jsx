"use client";
import { useEffect, useState } from 'react';
import neo4j from 'neo4j-driver';
import readNodes from '@/Utils/ReadNodes';
import readOneNode from '@/Utils/ReadOneNode'; // Import the function to read a single node
import dynamic from 'next/dynamic';

export default function Neo4jPage() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [viz, setViz] = useState(null);

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
    subscribeToChanges();
    return () => {
      if (session) {
        session.close();
      }
    }
  },[]);

  useEffect(() => {
    if (!loading && nodes.length > 0) {
      if (viz) {
        viz.render(); // Call render method when viz is available
      }
    }
  }, [loading, nodes, viz]);

  useEffect(() => {
    if (!loading && nodes.length > 0) {
      renderVisualization(nodes);
    }
  }, [loading, nodes]);

  async function subscribeToChanges() {
    try {
      const session = driver.session();
      await session.run("MATCH (n) RETURN n", {
        onNext: async (record) => {
          const data = await readNodes();
          setNodes(data);
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
      const NeoVis = await import('neovis.js/dist/neovis.js'); // Dynamically import NeoVis
      const config = {
        containerId: "viz",
        neo4j: {
          serverUrl: "bolt://localhost:7687",
          serverUser: "neo4j",
          serverPassword: "testingInstance",
        },
        nodes: {
          label: true, 
          size: 'age',
          title: 'name',
        },
        relationships: {
          KNOWS: {
            thickness: 'weight',
          },
        },
        initialCypher: "MATCH (n)-[r:KNOWS]->(m) RETURN ID(n) AS nodeId, n, ID(r) AS relationId, r, ID(m) AS connectedNodeId, m LIMIT 100",
        clickNodes: handleClickNode // Add clickNodes callback
      };

      const viz = new NeoVis.default(config);
      setViz(viz); // Set viz object in state
    } catch (error) {
      console.error('Error rendering visualization:', error);
    }
  
  }

  async function handleClickNode(nodeId) {
    try {
      const node = nodes.find(node => node.id === nodeId);
      const selectedNodeData = await readOneNode(node.name); // Pass node name to readOneNode
      setSelectedNode(selectedNodeData);
      if (viz) {
        viz.clearNetwork(); // Clear the current visualization
        renderSubGraph(node.name); // Pass node name to renderSubGraph
      }
    } catch (error) {
      console.error('Error fetching node relationships:', error);
    }
  }

  async function renderSubGraph(selectedNodeName) {
    try {
      const cypher = `
        MATCH (n)-[r]-(m)
        WHERE( n.name = "Person 1")
        RETURN n, r, m
      `;
      const NeoVis = await import('neovis.js/dist/neovis.js'); 
      const config = {
        containerId: "viz",
        neo4j: {
          serverUrl: "bolt://localhost:7687",
          serverUser: "neo4j",
          serverPassword: "testingInstance",
        },
        nodes: {
          Person: {
            size: 'age',
            title: 'name',
            label: 'name', // Add label property to display node labels
          }
        },
        relationships: {
          KNOWS: {
            thickness: 'weight',
          },
        },
        initialCypher: cypher,
        initialCypherParameters: { selectedNodeName: selectedNodeName } // Pass node name parameter
      }
      const subViz = new NeoVis.default(config);
      subViz.render();
    } catch (error) {
      console.error('Error rendering sub-graph:', error);
    }
  }
  

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '50%', height: '100vh' }}>
        <h1>Neo4j Visualization</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div id="viz" style={{ width: '100%', height: '80%' }}></div>
        )}
      </div>
      <div style={{ width: '50%', height: '100vh', overflowY: 'scroll' }}>
        <h2>Node Names</h2>
        <ul>
          {nodes.map((node, index) => (
            <li key={index} onClick={() => handleClickNode(node.id)} style={{ cursor: 'pointer' }}>
              {node.name}
            </li>
          ))}
        </ul>
        <h2>Selected Node Relationships:</h2>
        {selectedNode && selectedNode.map((data, index) => (
          <div key={index}>
            <h3>Node: {JSON.stringify(data.node)}</h3>
            <p>Relationship: {data.relationship}</p>
            <p>Connected Node: {JSON.stringify(data.connectedNode)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
