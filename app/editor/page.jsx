
"use client"
import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import neo4j from 'neo4j-driver';
import readNodes from '@/Utils/ReadNodes';


const Neo4jPage = () => {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viz, setViz] = useState(null);
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
- > formatting Syntax is to make it as readable
- > as possible. The idea is that a
- > Markdown-formatted document should be
- > publishable as-is, as plain text, without
- > looking like it's been marked up with tags
- > or formatting instructions.

Ready to start writing?  Either start changing stuff on the left or
[clear everything](/demo/?text=) with a simple click.

`;
  const uri = 'bolt://localhost:7687';
  const user = 'neo4j';
  const password = 'testingInstance';
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  
  const [database, setDatabase] = useState([]);
  const [markdown] = useState(defaultMarkdown);

  useEffect(()=>{
    async function fetchNodeNames() {
      const session = driver.session();

      try {
        const result = await session.run("MATCH (n:Entity) RETURN collect(n.Name) AS nodeNames");
        const nodeNames = result.records[0].get('nodeNames');
        setDatabase(nodeNames);
      } catch (error) {
        console.error('Error fetching node names:', error);
      } finally {
        await session.close();
      }
    }
    fetchNodeNames();
  },[]) 
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  const handleSearch = async () => {
    try {
      const session = driver.session();
      const result = await session.run(
        `MATCH (n:Entity {Name: $searchTerm}) RETURN n`,
        { searchTerm }
      );
      const searchResults = result.records.map((record) => record.get('n'));
      setSearchResults(searchResults);
      await session.close();
  
      // Trigger the handleWordClick function with the searched word
      if (searchResults.length > 0) {
        const searchedWord = searchResults[0].properties.Name;
        window.handleWordClick(searchedWord);
      }
    } catch (error) {
      console.error('Error performing search:', error);
    }
  };
  const highlightWords = (text) => {
    return text.replace(/\b(\w+)\b/g, (word) => {
      if (database.includes(word) || searchResults.some((result) => result.properties.name === word)) {
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
      renderVisualization(nodes);
    }
  }, [loading, nodes]);

  async function subscribeToChanges() {
    try {
      const session = driver.session();
      await session.run('MATCH (n) RETURN n', {
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
      let cypher = `MATCH (n:Entity)
                  OPTIONAL MATCH (n)-[r:RELATES_TO]->(m:Entity)
                  RETURN n, r, m`;
    if (searchResults.length > 0) {
      const searchResultNames = searchResults.map((record) => `'${record.get('n').properties.Name}'`).join(', ')
      cypher = `MATCH (n:Entity)
      WHERE n.Name IN [${searchResultNames}]
      OPTIONAL MATCH (n)-[r:RELATES_TO]->(m:Entity)
      RETURN n, r, m`;
    }
      const NeoVis = await import('neovis.js/dist/neovis.js'); // Dynamically import NeoVis
      const config = {
        containerId: 'viz',
        neo4j: {
          serverUrl: 'bolt://localhost:7687',
          serverUser: 'neo4j',
          serverPassword: 'testingInstance',
        },
        labels: {
          "Entity": {
            label: 'Name',
            size: 'Version'
          }
        },
        relationships: {
          "RELATES_TO": {
            thickness: 2
          }
        },
        initialCypher: cypher,
        clickNodes: handleWordClick, // Add clickNodes callback
      };

      const viz = new NeoVis.default(config);
      setViz(viz); // Set viz object in state
    } catch (error) {
      console.error('Error rendering visualization:', error);
    }
  }
  useEffect(()=>{
    if(typeof window!==undefined){
      window.handleWordClick = async (word) => {
        if (viz) {
          viz.clearNetwork(); 
        }
        try {
          const cypher = `
          MATCH (n:Entity {Name: '${word}'})
          OPTIONAL MATCH (n)-[r:RELATES_TO]->(m:Entity)
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
            labels: {
              "Entity": {
                label: 'Name',
                size: 'Version'
              }
            },
            relationships: {
              "RELATES_TO": {
                thickness: 2
              }
            },
            initialCypher: cypher,
      
          }
          const subViz = new NeoVis.default(config);
          subViz.render();
        } catch (error) {
          console.error('Error rendering sub-graph:', error);
        }
      };
        
    }
    
  },[])

  // Function to fetch data related to the clicked word from Neo4j

  return (
    <div>
  <nav className="flex items-center justify-between bg-blue-500 p-4">
    <div className="flex items-center">
      <h1 className="text-white text-2xl font-bold mr-4">Neo4j Visualization</h1>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search node"
          className="pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-white"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={handleSearch}
          className="absolute right-0 top-0 mt-0 mb-1 mr-2 px-4 py-2 bg-white text-blue-500 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-white"
        >
          Search
        </button>
      </div>
    </div>
  </nav>
  <div style={{ display: 'flex' }}>
    <div style={{ width: '50%', height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div id="viz" style={{ width: '100%', height: '100%' }}></div>
      )}
    </div>
    <div style={{ width: '50%', height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
      <h1 className="text-2xl font-bold mb-4">Markdown Content</h1>
      <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
    </div>
  </div>
</div>
  );
}; 
export default Neo4jPage;