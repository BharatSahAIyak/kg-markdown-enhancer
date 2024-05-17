FROM neo4j:5.19.0

# Configure Neo4j to load the APOC plugin and enable necessary APOC settings
ENV NEO4J_apoc_export_file_enabled=true \
    NEO4J_apoc_import_file_enabled=true \
    NEO4J_apoc_import_file_use__neo4j__config=true \
    NEO4J_PLUGINS='["apoc"]' \
    NEO4J_AUTH=neo4j/testingInstance

EXPOSE 7474 7687
