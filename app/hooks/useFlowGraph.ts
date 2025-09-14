import { useState, useCallback } from 'react';
import { applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';

type NodeType = { 
  id: string; 
  position: { x: number; y: number }; 
  data: { label: string }; 
  type?: string;
  style?: { backgroundColor?: string; borderColor?: string; color?: string; };
};
type EdgeType = { id: string; source: string; target: string; animated: boolean };

interface OutcomeAnalysis {
  positive_outcomes?: string[];
  negative_outcomes?: string[];
  neutral_mixed_outcomes?: string[];
}

export function useFlowGraph(initialNodes: NodeType[], initialEdges: EdgeType[]) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange<NodeType>[]) => {
      if (!nodes) return;
      
      const updatedNodes = applyNodeChanges(changes, nodes);
      setNodes(updatedNodes);
      
      // Check if any position changes occurred
      const hasPositionChange = changes.some(change => 
        change.type === 'position' && change.dragging === false
      );
      
      if (hasPositionChange) {
        // Update JSON file with new positions
        const updatedData = {
          nodes: updatedNodes,
          edges: edges || []
        };
        
        fetch('/api/update-nodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedData),
        }).catch(error => {
          console.error('Error updating node positions:', error);
        });
      }
    },
    [nodes, edges],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<EdgeType>[]) => {
      // Only allow edge selection, prevent deletion or other modifications
      const allowedChanges = changes.filter(change => 
        change.type === 'select'
      );
      
      if (allowedChanges.length > 0) {
        setEdges((edgesSnapshot) => applyEdgeChanges(allowedChanges, edgesSnapshot));
      }
    },
    [],
  );

  const createFlowFromOutcome = useCallback(async (
    scenario: string,
    analysis: OutcomeAnalysis,
    isFirstNode: boolean = true
  ) => {
    if (isFirstNode) {
      // Create first node with scenario as label
      const firstNode: NodeType = {
        id: '1',
        position: { x: 400, y: 50 },
        data: { label: scenario },
        type: 'input'
      };

      // Create outcome nodes directly without category nodes
      const outcomeNodes: NodeType[] = [];
      const outcomeEdges: EdgeType[] = [];
      let nodeId = 2;
      let xPosition = 100;

      // Create nodes from positive outcomes with green colors
      if (analysis.positive_outcomes) {
        analysis.positive_outcomes.forEach((outcome: string, index: number) => {
          const outcomeNode: NodeType = {
            id: String(nodeId++),
            position: { x: xPosition + (index * 200), y: 200 },
            data: { label: outcome },
            type: 'output',
            style: {
              backgroundColor: '#dcfce7',
              borderColor: '#22c55e',
              color: '#15803d'
            }
          };
          outcomeNodes.push(outcomeNode);
          outcomeEdges.push({
            id: `e1-${outcomeNode.id}`,
            source: '1',
            target: outcomeNode.id,
            animated: false
          });
        });
        
        xPosition += analysis.positive_outcomes.length * 200 + 100;
      }

      // Create nodes from negative outcomes with red colors
      if (analysis.negative_outcomes) {
        analysis.negative_outcomes.forEach((outcome: string, index: number) => {
          const outcomeNode: NodeType = {
            id: String(nodeId++),
            position: { x: xPosition + (index * 200), y: 200 },
            data: { label: outcome },
            type: 'output',
            style: {
              backgroundColor: '#fef2f2',
              borderColor: '#ef4444',
              color: '#dc2626'
            }
          };
          outcomeNodes.push(outcomeNode);
          outcomeEdges.push({
            id: `e1-${outcomeNode.id}`,
            source: '1',
            target: outcomeNode.id,
            animated: false
          });
        });
      }

      // Create nodes from neutral/mixed outcomes with yellow colors
      if (analysis.neutral_mixed_outcomes) {
        analysis.neutral_mixed_outcomes.forEach((outcome: string, index: number) => {
          const outcomeNode: NodeType = {
            id: String(nodeId++),
            position: { x: xPosition + (index * 200), y: 200 },
            data: { label: outcome },
            type: 'output',
            style: {
              backgroundColor: '#fefce8',
              borderColor: '#eab308',
              color: '#a16207'
            }
          };
          outcomeNodes.push(outcomeNode);
          outcomeEdges.push({
            id: `e1-${outcomeNode.id}`,
            source: '1',
            target: outcomeNode.id,
            animated: false
          });
        });
      }

      const allNodes = [firstNode, ...outcomeNodes];
      const allEdges = outcomeEdges;

      setNodes(allNodes);
      setEdges(allEdges);

      // Save to file
      const updatedData = { nodes: allNodes, edges: allEdges };
      try {
        await fetch('/api/update-nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });
      } catch (error) {
        console.error('Error updating file:', error);
      }
    } else {
      // Handle adding outcome nodes to existing selected node
      if (!selectedNode || !nodes || !edges) return;

      let nodeId = Math.max(...nodes.map(n => parseInt(n.id))) + 1;
      const newNodes: NodeType[] = [];
      const newEdges: EdgeType[] = [];
      
      const baseY = selectedNode.position.y + 150;
      let xPosition = selectedNode.position.x - 200;

      // Create child nodes from positive outcomes with green colors
      if (analysis.positive_outcomes) {
        analysis.positive_outcomes.forEach((outcome: string, index: number) => {
          const childNode: NodeType = {
            id: String(nodeId++),
            position: { x: xPosition + (index * 180), y: baseY },
            data: { label: outcome },
            type: 'output',
            style: {
              backgroundColor: '#dcfce7',
              borderColor: '#22c55e',
              color: '#15803d'
            }
          };
          newNodes.push(childNode);
          newEdges.push({
            id: `e${selectedNode.id}-${childNode.id}`,
            source: selectedNode.id,
            target: childNode.id,
            animated: false
          });
        });
        
        xPosition += analysis.positive_outcomes.length * 180 + 50;
      }

      // Create child nodes from negative outcomes with red colors
      if (analysis.negative_outcomes) {
        analysis.negative_outcomes.forEach((outcome: string, index: number) => {
          const childNode: NodeType = {
            id: String(nodeId++),
            position: { x: xPosition + (index * 180), y: baseY },
            data: { label: outcome },
            type: 'output',
            style: {
              backgroundColor: '#fef2f2',
              borderColor: '#ef4444',
              color: '#dc2626'
            }
          };
          newNodes.push(childNode);
          newEdges.push({
            id: `e${selectedNode.id}-${childNode.id}`,
            source: selectedNode.id,
            target: childNode.id,
            animated: false
          });
        });
        
        xPosition += analysis.negative_outcomes.length * 180 + 50;
      }

      // Create child nodes from neutral/mixed outcomes with yellow colors
      if (analysis.neutral_mixed_outcomes) {
        analysis.neutral_mixed_outcomes.forEach((outcome: string, index: number) => {
          const childNode: NodeType = {
            id: String(nodeId++),
            position: { x: xPosition + (index * 180), y: baseY },
            data: { label: outcome },
            type: 'output',
            style: {
              backgroundColor: '#fefce8',
              borderColor: '#eab308',
              color: '#a16207'
            }
          };
          newNodes.push(childNode);
          newEdges.push({
            id: `e${selectedNode.id}-${childNode.id}`,
            source: selectedNode.id,
            target: childNode.id,
            animated: false
          });
        });
      }

      // Update selected node type to 'default' if it was 'output'
      const updatedNodes = nodes.map(node => 
        node.id === selectedNode.id && node.type === 'output'
          ? { ...node, type: 'default' }
          : node
      );

      const allNodes = [...updatedNodes, ...newNodes];
      const allEdges = [...edges, ...newEdges];

      setNodes(allNodes);
      setEdges(allEdges);

      // Save to file
      const updatedData = { nodes: allNodes, edges: allEdges };
      try {
        await fetch('/api/update-nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });
      } catch (error) {
        console.error('Error updating file:', error);
      }
    }
  }, [selectedNode, nodes, edges]);

  return {
    nodes,
    edges,
    selectedNode,
    setSelectedNode,
    onNodesChange,
    onEdgesChange,
    createFlowFromOutcome,
  };
}