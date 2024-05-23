"use client";
import React, { useEffect, useState } from "react";
import { marked } from "marked";
import neo4j from "neo4j-driver";
import readNodes from "@/Utils/ReadNodes";
import axios from "axios";

const Neo4jPage = () => {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viz, setViz] = useState(null);
  const [searchText, setSearchText] = useState("");
  const defaultMarkdown = `
Marked - Markdown Parser
========================

[Marked] lets you convert [Markdown] into HTML.  Markdown is a simple text format whose goal is to be very easy to read and write, even when not converted to HTML.  This demo page will let you type anything you like and see how it gets converted.  Live.  No more waiting around.

How To Use The Demo
-------------------

1. Type in stuff on the left.
2. See the live updates on the right.

That's it.  Pretty simple.  There's also a drop-down option above to switch between various views:

- **Preview:**  A live display of the generated HTML as it would render in a browser.
- **HTML Source:**  The generated HTML before your browser makes it pretty.
- **Lexer Data:**  What [marked] uses internally, in case you like gory stuff like this.
- **Quick Reference:**  A brief run-down of how to format things using markdown.

*Why Markdown?*
-------------

It's easy.  It's not overly bloated, unlike HTML.  Also, as the creator of [markdown] says,

- > The overriding design goal for Markdown's
- > formatting syntax is to make it as readable
- > as possible. The idea is that a
- > Markdown-formatted document should be
- > publishable as-is, as plain text, without
- > looking like it's been marked up with tags
- > or formatting instructions.

Ready to start writing?  Either start changing stuff on the left or
[clear everything](/demo/?text=) with a simple click.

`;
  const uri = "bolt://localhost:7687";
  const user = "neo4j";
  const password = "testingInstance";
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  const [database, setDatabase] = useState([]);
  const [markdown] = useState(defaultMarkdown);

  const createEmbeddings = async () => {
    const session = driver.session();
    try {
      //Retreive each node from the database
      // await session.run("CALL db.index.vector.createNodeIndex('movie-embeddings','Movie','vec_embeddings',1536,'cosine')");
      const nodes_res = await session.run("MATCH (n:Movie) RETURN n LIMIT 5");
      setLoading(false);

      const nodes = nodes_res.records.map((record) => {
        const node = record.get("n");
       
        return {
          id: node.identity.toInt(),
          description: node.properties.tagline,
          title: node.properties.title,
        };
      });
    
      const apiKey = "";

      for (const node of nodes) {
        try {
          // Call OpenAI API to get embeddings for each node description
          setLoading(true);
          const response = await axios.post(
            "https://api.openai.com/v1/embeddings",
            {
              input: `${node.description}`,
              model: "text-embedding-3-small",
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + apiKey,
              },
            }
          );
          const embedding = response?.data?.data[0]?.embedding;
         

          // Store the embeddings in the database
          const updated_node = await session.run(
            "MATCH (n:Movie) WHERE id(n) = $nodeId SET n.vec_embeddings = $embedding RETURN n",
            {
              nodeId: neo4j.int(node.id),
              embedding:embedding,
            }
          );
          setLoading(false);
        } catch (error) {
          console.error("Error updating nodes:", error);
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error fetching nodes:", error);
      setLoading(false);
    } finally {
      await session.close();
    }


  };

  const handleSearch = async () => {
    const apiKey = "sk-proj-AWmjnsPL6Bfs8xnCzpliT3BlbkFJIqV3REcKdOrlBNIWNhRq";
    const session = driver.session();
    setLoading(true);
    try{

    const response = await axios.post(
      "https://api.openai.com/v1/embeddings",
      {
        input: `${searchText}`,
        model: "text-embedding-3-small",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
      }
    );
    const embedding = response?.data?.data[0]?.embedding;
    // console.log(embedding);
    const result=await session.run("CALL db.index.vector.queryNodes('movie-embeddings',5,$embedding) YIELD node as similarNode,score RETURN similarNode ",{embedding:embedding});
    // console.log(result.records);
    const search_nodes = result.records.map((record) => {
      const node = record.get("similarNode");
      return {
        id: node.identity.toInt(),
        description: node.properties.tagline,
        title: node.properties.title,
      };
    });
    setNodes(search_nodes);
    setLoading(false);

  } catch (error) {
    console.error("Error updating nodes:", error);
    setLoading(false);
  }finally
  {
    await session.close();  
  }



  }


  useEffect(() => {
    async function fetchNodeNames() {
      try {
        const result = await session.run(
          "MATCH (n) RETURN collect(n.name) AS nodeNames"
        );
        const nodeNames = result.records[0].get("nodeNames");
        setDatabase(nodeNames);
      } catch (error) {
        console.error("Error fetching node names:", error);
      } finally {
        await session.close();
      }
    }
    fetchNodeNames();
    createEmbeddings();
  }, []);

  const highlightWords = (text) => {
    return text.replace(/\b(\w+)\b/g, (word) => {
      if (database.includes(word)) {
        return `<button onclick="handleWordClick('${word}')" style="background-color: yellow; cursor:pointer">${word}</button>`;
      } else {
        return word;
      }
    });
  };

  const html = marked.parse(markdown);
  const highlightedHtml = highlightWords(html);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await readNodes();
        setNodes(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching nodes:", error);
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
    };
  }, []);

  useEffect(() => {
    if (!loading && nodes.length > 0) {
      if (viz) {
        viz.render(); // Call render method when viz is available
      }
    }
  }, [loading, nodes, viz]);

  useEffect(() => {
    if (!loading && nodes.length > 0) {
      renderVis(nodes);
      // renderVisualization(nodes);
    }
  }, [loading, nodes]);

    useEffect(() => {
    console.log(nodes);
  }, [ nodes]);

  async function subscribeToChanges() {
    try {
      const session = driver.session();
      await session.run("MATCH (n) RETURN n", {
        onNext: async (record) => {
          const data = await readNodes();
          setNodes(data);
        },
        onError: (error) => {
          console.error("Subscription error:", error);
        },
      });
    } catch (error) {
      console.error("Error subscribing to changes:", error);
    }
  }


  // Function to view only the required nodes
  async function renderVis(data) {
    try {
      const nodeIds = data.map(node => node.id).join(',');
      console.log(nodeIds);
      const cypherQuery = `MATCH (n) WHERE id(n) IN [${nodeIds}] RETURN n`;
      const NeoVis = await import("neovis.js/dist/neovis.js"); // Dynamically import NeoVis
      const config = {
        containerId: "viz",
        neo4j: {
          serverUrl: "bolt://localhost:7687",
          serverUser: "neo4j",
          serverPassword: "testingInstance",
        },
        labels: {
          Movie: {
            label: "title",
            // size: "age",
          },
          Person:{
            label: "name",
          }
        },
        relationships: {
          ACTED_IN: {
            thickness: 2,
          },
        },
        initialCypher: cypherQuery,
        clickNodes: handleWordClick, // Add clickNodes callback
      };

      const viz = new NeoVis.default(config);
      setViz(viz); // Set viz object in state
    } catch (error) {
      console.error("Error rendering visualization:", error);
    }
  }

  async function renderVisualization(data) {
    try {
      const cypher = `MATCH (n:Word)
      OPTIONAL MATCH (n)-[r:VERB]->(m:Word)
      RETURN n, r, m`;
      const NeoVis = await import("neovis.js/dist/neovis.js"); // Dynamically import NeoVis
      const config = {
        containerId: "viz",
        neo4j: {
          serverUrl: "bolt://localhost:7687",
          serverUser: "neo4j",
          serverPassword: "testingInstance",
        },
        labels: {
          Word: {
            label: "name",
            size: "age",
          },
        },
        relationships: {
          VERB: {
            thickness: 2,
          },
        },
        initialCypher: cypher,
        clickNodes: handleWordClick, // Add clickNodes callback
      };

      const viz = new NeoVis.default(config);
      setViz(viz); // Set viz object in state
    } catch (error) {
      console.error("Error rendering visualization:", error);
    }
  }


  useEffect(() => {
    if (typeof window !== undefined) {
      window.handleWordClick = async (word) => {
        if (viz) {
          viz.clearNetwork();
        }
        try {
          const cypher = `
            MATCH (n {name: '${word}'})-[r]-(m)
            RETURN n, r, m
          `;
          const NeoVis = await import("neovis.js/dist/neovis.js");
          const config = {
            containerId: "viz",
            neo4j: {
              serverUrl: "bolt://localhost:7687",
              serverUser: "neo4j",
              serverPassword: "testingInstance",
            },
            labels: {
              Word: {
                label: "name",
                size: "age",
              },
            },
            relationships: {
              VERB: {
                thickness: 2,
              },
            },
            initialCypher: cypher,
          };
          const subViz = new NeoVis.default(config);
          subViz.render();
        } catch (error) {
          console.error("Error rendering sub-graph:", error);
        }
      };
    }
  }, []);

  // Function to fetch data related to the clicked word from Neo4j

  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "50%", height: "100vh", overflowY: "auto" }}>
        <h1>Neo4j Visualization</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div id="viz" style={{ width: "100%", height: "80%" }}></div>
        )}
      </div>
      <div style={{ width: "50%", height: "100vh", overflowY: "auto" }}>
        <h1>Markdown Content</h1>
        <input type="text" value={searchText} onChange={(e)=>setSearchText(e.target.value)}></input>
        <button onClick={handleSearch}>Search</button>
        <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </div>
    </div>
  );
};
export default Neo4jPage;
