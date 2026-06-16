import json
import os

with open('docs-project/knowledge-graph.json') as f:
    kg = json.load(f)

all_files = sorted(kg['knowledge_graph'].keys())

# Already have Related Files (from parent's grep)
already_have = {
    'CLAUDE.md', 'README.md', 'backend/CLAUDE.md', 'frontend/CLAUDE.md',
    'docs-project/README.md', 'docs-project/CLAUDE.md',
    'docs-project/concepts/README.md', 'docs-project/concepts/fyp-cycle.md',
    'docs-project/concepts/authorization.md', 'docs-project/concepts/database-schema.md',
    'docs-project/concepts/meeting-log-signature.md', 'docs-project/concepts/audience-filtering.md',
    'docs-project/concepts/frontend-architecture.md', 'docs-project/concepts/api-contract.md',
    'docs-project/modules/student.md', 'docs-project/demo/walkthrough.md',
    'docs-project/demo/ai-analyzer-demo.md', 'docs-project/demo/ai-chatbot-demo.md',
    'docs-project/demo/ai-recommendation-demo.md', 'ai-recommendation/CLAUDE.md',
    'ai-proposal-analyzer/CLAUDE.md', 'ai-chatbot/CLAUDE.md'
}

print("Files that NEED Related Files:")
need_update = []
not_found = []
for f in all_files:
    if f not in already_have:
        if os.path.exists(f):
            need_update.append(f)
            print(f"  NEED: {f}")
        else:
            not_found.append(f)
            print(f"  NOT_FOUND: {f}")

print(f"\nTotal to update: {len(need_update)}")
print(f"Total not found: {len(not_found)}")
