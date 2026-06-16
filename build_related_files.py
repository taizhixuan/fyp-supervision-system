import json

with open('docs-project/knowledge-graph.json') as f:
    kg = json.load(f)

# Files to process (30 total, doing first 10)
files_to_process = [
    'docs-project/api/README.md',
    'docs-project/api/auth-endpoints.md',
    'docs-project/api/student-endpoints.md',
    'docs-project/concepts/deployment-readiness.md',
    'docs-project/concepts/docker-stack.md',
    'docs-project/concepts/file-uploads.md',
    'docs-project/concepts/notifications.md',
    'docs-project/concepts/testing-strategy.md',
    'docs-project/conference-paper/README.md',
    'docs-project/conference-paper/appendix-commercialisation.md',
]

for filepath in files_to_process:
    file_data = kg['knowledge_graph'].get(filepath)
    if file_data and 'related_files' in file_data:
        related = file_data['related_files']
        # Take max 7 links
        related = related[:7]
        
        print(f"\n{filepath}:")
        print("## Related Files\n")
        for item in related:
            print(f"- [[{item['file']}]] — {item['reason']}")
