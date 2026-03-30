import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { FloppyDisk, Play, Plus, Trash } from '@phosphor-icons/react';
import apiClient, { formatApiError } from '../lib/api';
import { toast } from 'sonner';

const nodeTypes = {
  indicator: ({ data }) => (
    <div className="px-4 py-3 border-2 border-primary bg-white font-mono text-sm min-w-[150px]">
      <div className="font-bold text-xs uppercase tracking-wider mb-1">INDICATOR</div>
      <div className="text-xs">{data.label}</div>
    </div>
  ),
  condition: ({ data }) => (
    <div className="px-4 py-3 border-2 border-accent bg-white font-mono text-sm min-w-[150px]">
      <div className="font-bold text-xs uppercase tracking-wider mb-1">CONDITION</div>
      <div className="text-xs">{data.label}</div>
    </div>
  ),
  action: ({ data }) => (
    <div className="px-4 py-3 border-2 border-success bg-white font-mono text-sm min-w-[150px]">
      <div className="font-bold text-xs uppercase tracking-wider mb-1">ACTION</div>
      <div className="text-xs">{data.label}</div>
    </div>
  ),
};

const StrategyBuilderPage = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [strategyName, setStrategyName] = useState('Untitled Strategy');
  const [isSaving, setIsSaving] = useState(false);
  const [showNodeLibrary, setShowNodeLibrary] = useState(true);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const nodeLibrary = [
    { type: 'indicator', label: 'RSI' },
    { type: 'indicator', label: 'Moving Average' },
    { type: 'indicator', label: 'MACD' },
    { type: 'indicator', label: 'Bollinger Bands' },
    { type: 'condition', label: 'Greater Than' },
    { type: 'condition', label: 'Less Than' },
    { type: 'condition', label: 'Cross Above' },
    { type: 'condition', label: 'Cross Below' },
    { type: 'action', label: 'Buy' },
    { type: 'action', label: 'Sell' },
    { type: 'action', label: 'Close Position' },
  ];

  const addNode = (type, label) => {
    const newNode = {
      id: `${Date.now()}`,
      type,
      position: { x: 250, y: 100 + nodes.length * 80 },
      data: { label },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const saveStrategy = async () => {
    if (!strategyName.trim()) {
      toast.error('Please enter a strategy name');
      return;
    }

    if (nodes.length === 0) {
      toast.error('Please add at least one node to your strategy');
      return;
    }

    setIsSaving(true);
    try {
      const strategyData = {
        name: strategyName,
        description: `Strategy with ${nodes.length} nodes`,
        json_definition: { nodes, edges },
        tags: ['custom'],
      };

      await apiClient.post('/strategies', strategyData);
      toast.success('Strategy saved successfully!');
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col" data-testid="strategy-builder-page">
      {/* Header */}
      <div className="border-b-2 border-border pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <Label className="text-xs font-mono uppercase tracking-wider mb-2 block">Strategy Name</Label>
            <Input
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              className="rounded-none border-2 font-mono"
              data-testid="strategy-name-input"
              placeholder="Enter strategy name"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="rounded-none border-2 font-mono text-xs uppercase tracking-wider"
              onClick={() => setShowNodeLibrary(!showNodeLibrary)}
              data-testid="toggle-library-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showNodeLibrary ? 'Hide' : 'Show'} Library
            </Button>
            <Button
              variant="outline"
              className="rounded-none border-2 font-mono text-xs uppercase tracking-wider"
              onClick={() => {
                setNodes([]);
                setEdges([]);
              }}
              data-testid="clear-canvas-button"
            >
              <Trash className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button
              className="rounded-none font-mono text-xs uppercase tracking-wider"
              onClick={saveStrategy}
              disabled={isSaving}
              data-testid="save-strategy-button"
            >
              <FloppyDisk className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Strategy'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex space-x-4">
        {/* Node Library */}
        {showNodeLibrary && (
          <Card className="w-64 border-2 border-border rounded-none shadow-none p-4 overflow-y-auto">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider mb-4">Node Library</h3>
            <div className="space-y-2">
              {nodeLibrary.map((node, index) => (
                <button
                  key={index}
                  onClick={() => addNode(node.type, node.label)}
                  className="w-full p-3 border-2 border-border hover:border-primary hover:bg-primary hover:text-primary-foreground transition-base text-left"
                  data-testid={`add-node-${node.type}-${index}`}
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider opacity-70 mb-1">
                    {node.type}
                  </div>
                  <div className="text-xs font-mono font-semibold">{node.label}</div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Canvas */}
        <div className="flex-1 border-2 border-border bg-secondary/20" data-testid="strategy-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls className="border-2 border-border rounded-none" />
            <MiniMap className="border-2 border-border rounded-none" />
            <Background variant="dots" gap={12} size={1} />
            <Panel position="top-left" className="bg-white border-2 border-border p-2">
              <p className="text-xs font-mono">
                <span className="font-bold">Nodes:</span> {nodes.length} | <span className="font-bold">Connections:</span> {edges.length}
              </p>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default StrategyBuilderPage;