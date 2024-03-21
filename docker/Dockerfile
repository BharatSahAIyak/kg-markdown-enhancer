FROM neo4j:latest

ENV NEO4J_apoc_export_file_enabled=true \
    NEO4J_apoc_import_file_enabled=true \
    NEO4J_apoc_import_file_use__neo4j__config=true \
    NEO4J_dbms_security_procedures_unrestricted=apoc.* \
    NEO4J_PLUGINS=apoc-extended \
    NEO4J_AUTH=neo4j/testingInstance

EXPOSE 7474 7687
