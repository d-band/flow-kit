const cycleEdges = (g) => {
  const stack = {};
  const visited = {};
  const result = [];

  const dfs = (u) => {
    if (visited[u]) {
      return;
    }
    visited[u] = true;
    stack[u] = true;
    g.outVertices(u).forEach((v) => {
      if (stack[v]) {
        result.push([u, v]);
      } else {
        dfs(v);
      }
    });
    delete stack[u];
  };

  g.vertices().forEach((u) => {
    dfs(u);
  });

  return result;
};

const cycleRemoval = (g) => {
  cycleEdges(g).forEach(([u, v]) => {
    const obj = g.edge(u, v);
    g.removeEdge(u, v);

    if (u === v) return;

    const edge = g.edge(v, u);
    if (edge) {
      edge.multiple = true;
    } else {
      g.addEdge(v, u, { reversed: true, ...obj });
    }
  });
};

export default cycleRemoval;
