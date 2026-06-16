import json

with open('docs-project/knowledge-graph.json') as f:
    kg = json.load(f)

all_files = sorted(kg['knowledge_graph'].keys())
print(f"Total files in knowledge graph: {len(all_files)}")
for f in all_files:
    print(f)
