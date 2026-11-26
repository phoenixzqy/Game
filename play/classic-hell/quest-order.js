// Stable prerequisite order, including moved quests whose original IDs are earlier.
export function orderQuestDefinitions(definitions) {
  const byId = new Map(definitions.map((q) => [q.Index, q])),
    done = new Set(),
    visiting = new Set(),
    ordered = [];
  function visit(q) {
    if (done.has(q.Index) || visiting.has(q.Index)) return;
    visiting.add(q.Index);
    const before = byId.get(q.RequiredQuest);
    if (before) visit(before);
    visiting.delete(q.Index);
    done.add(q.Index);
    ordered.push(q);
  }
  definitions.forEach(visit);
  return ordered;
}

