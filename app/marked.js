const fs = require('fs');
const marked = require('marked');

// Step 1: Read Markdown from Local Config File
const configFilePath = 'config.md';
let markdownContent;

try {
    markdownContent = fs.readFileSync(configFilePath, 'utf8');
    console.log("Markdown content read successfully.");
} catch (err) {
    console.error(`Error reading markdown file: ${err}`);
}

// Step 2: Render Markdown Using Marked.js
const renderedHTML = marked(markdownContent);
console.log("Markdown content rendered successfully.");

// Step 3: Highlight Named Entities
const namedEntities = ['Chicago', 'New York', 'Los Angeles']; // Example list of named entities
let highlightedMarkdown = markdownContent;

namedEntities.forEach(entity => {
    highlightedMarkdown = highlightedMarkdown.replace(
        new RegExp(entity, 'g'),
        `<span class="highlighted-entity">${entity}</span>`
    );
});

console.log("Named entities highlighted successfully.");

// Step 4: Integration with Database (Mocked with JSON file)
const dbData = require('./entities.json'); // Example JSON file containing database data

// Assuming dbData is an array of objects with 'name' property representing named entities
const namedEntitiesFromDB = dbData.map(entry => entry.name);

console.log("Data retrieved from database successfully.");

// Step 5: Implement Zoom Functionality
// Import graph visualization library
const d3 = require('d3');
const graphData = [
  { id: 'node1', x: 50, y: 100, radius: 15 },
  { id: 'node2', x: 200, y: 100, radius: 15 },
  { id: 'node3', x: 350, y: 100, radius: 15 }
];

// Function to create or update the graph
function updateGraph(selectedNode) {
  const svg = d3.select('svg');

  // Bind data to circles
  const nodes = svg.selectAll('.node')
    .data(graphData, d => d.id);

  // Enter selection: append circles for new data
  nodes.enter().append('circle')
    .attr('class', 'node')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', d => d.radius);

  // Update selection: update existing circles
  nodes
    .attr('class', d => (d.id === selectedNode ? 'node highlighted-node' : 'node')) // Highlight selected node
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', d => d.radius);

  // Exit selection: remove circles for old data
  nodes.exit().remove();
}

// Call the updateGraph function with a node ID to highlight it
updateGraph('node1');

// Step 5: Implement Zoom Functionality
function zoomIntoNode(node) {
    // Example: Find the node in your graph visualization
    const selectedNode = d3.select(`#${node}`);

    // Check if the node exists
    if (!selectedNode.empty()) {
        // Example: Zoom into the selected node
        selectedNode.transition().duration(1000)
            .attr('r', 20); // Adjust size or any other property as needed

        // Update the graph to focus on the selected node
        updateGraph(selectedNode);
    } else {
        console.error(`Node '${node}' not found in the graph.`);
    }
}


// Mock function to simulate highlighting and clicking on named entities
function simulateHighlightAndClick(entity) {
    console.log(`Clicked on entity: ${entity}`);
    zoomIntoNode(entity);
}

// Example usage:
const highlightedEntity = 'Chicago';
const highlightedMarkdownWithClick = highlightedMarkdown.replace(
    new RegExp(highlightedEntity, 'g'),
    `<a href="#" onclick="simulateHighlightAndClick('${highlightedEntity}')">${highlightedEntity}</a>`
);

console.log(highlightedMarkdownWithClick);
