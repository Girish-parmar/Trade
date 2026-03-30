import { create } from 'zustand';

const useStrategyStore = create((set, get) => ({
  strategies: [],
  currentStrategy: null,
  nodes: [],
  edges: [],
  
  setStrategies: (strategies) => set({ strategies }),
  
  setCurrentStrategy: (strategy) => set({ currentStrategy: strategy }),
  
  setNodes: (nodes) => set({ nodes }),
  
  setEdges: (edges) => set({ edges }),
  
  addNode: (node) => {
    const { nodes } = get();
    set({ nodes: [...nodes, node] });
  },
  
  removeNode: (nodeId) => {
    const { nodes, edges } = get();
    set({ 
      nodes: nodes.filter(n => n.id !== nodeId),
      edges: edges.filter(e => e.source !== nodeId && e.target !== nodeId)
    });
  },
  
  addEdge: (edge) => {
    const { edges } = get();
    set({ edges: [...edges, edge] });
  },
}));

export default useStrategyStore;