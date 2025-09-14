"use client";
import { useState, useCallback } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, NodeChange, EdgeChange, Node, ConnectionMode } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

type NodeType = { id: string; position: { x: number; y: number }; data: { label: string }; type?: string };
type EdgeType = { id: string; source: string; target: string; animated: boolean };

interface FlowGraphProps {
  initialNodes: NodeType[];
  initialEdges: EdgeType[];
}

export default function FlowGraph({ initialNodes, initialEdges }: FlowGraphProps) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [newNodeLabel, setNewNodeLabel] = useState('');

  const onNodesChange = useCallback(
    (changes: NodeChange<NodeType>[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes);
      setNodes(updatedNodes);
      
      // Check if any position changes occurred
      const hasPositionChange = changes.some(change => 
        change.type === 'position' && change.dragging === false
      );
      
      if (hasPositionChange) {
        // Update initialNodes.json with new positions
        const updatedData = {
          nodes: updatedNodes,
          edges: edges
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
  const onConnect = useCallback(
    (params: any) => {
      // Disable manual edge creation - users can only create edges by clicking nodes
      return;
    },
    [],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as NodeType);
    setShowPopup(true);
  }, []);

  const handleCreateNode = useCallback(async () => {
    if (!selectedNode || !newNodeLabel.trim()) return;

    // Generate new node ID
    const newNodeId = String(Math.max(...nodes.map(n => parseInt(n.id))) + 1);
    
    // Get existing children of the selected node
    const existingChildren = edges.filter(edge => edge.source === selectedNode.id);
    const childrenCount = existingChildren.length;
    
    // Calculate position for new node with equal spacing
    const spacing = 200;
    const totalWidth = childrenCount * spacing;
    const startX = selectedNode.position.x - totalWidth / 2;
    const newX = startX + (childrenCount * spacing);
    const newY = selectedNode.position.y + 150;

    // Update positions of existing children to maintain equal spacing
    const childNodes = nodes.filter(node => 
      existingChildren.some(edge => edge.target === node.id)
    );

    const updatedNodesWithSpacing = nodes.map(node => {
      const childIndex = childNodes.findIndex(child => child.id === node.id);
      if (childIndex !== -1) {
        return {
          ...node,
          position: {
            ...node.position,
            x: startX + (childIndex * spacing)
          }
        };
      }
      return node;
    });

    // Create new node
    const newNode: NodeType = {
      id: newNodeId,
      position: { x: newX, y: newY },
      data: { label: newNodeLabel.trim() },
      type: 'output'
    };

    // Update selected node type to 'default'
    const updatedNodes = updatedNodesWithSpacing.map(node => 
      node.id === selectedNode.id 
        ? { ...node, type: 'default' }
        : node
    );

    // Add new node
    updatedNodes.push(newNode);

    // Create edge from selected node to new node
    const newEdge: EdgeType = {
      id: `e${selectedNode.id}-${newNodeId}`,
      source: selectedNode.id,
      target: newNodeId,
      animated: false
    };

    const updatedEdges = [...edges, newEdge];

    // Update state
    setNodes(updatedNodes);
    setEdges(updatedEdges);

    // Update initialNodes.json file
    const updatedData = {
      nodes: updatedNodes,
      edges: updatedEdges
    };

    try {
      const response = await fetch('/api/update-nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        console.error('Failed to update initialNodes.json');
      }
    } catch (error) {
      console.error('Error updating file:', error);
    }

    // Reset popup state
    setShowPopup(false);
    setNewNodeLabel('');
    setSelectedNode(null);
  }, [selectedNode, newNodeLabel, nodes, edges]);

  const handleCancelPopup = useCallback(() => {
    setShowPopup(false);
    setNewNodeLabel('');
    setSelectedNode(null);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        fitView
      />
      
      {showPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            minWidth: '300px'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Add New Node</h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
              Creating child node for: <strong>{selectedNode?.data.label}</strong>
            </p>
            <input
              type="text"
              value={newNodeLabel}
              onChange={(e) => setNewNodeLabel(e.target.value)}
              placeholder="Enter node label"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '15px',
                fontSize: '14px'
              }}
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleCreateNode()}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={handleCancelPopup}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNode}
                disabled={!newNodeLabel.trim()}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: newNodeLabel.trim() ? '#007acc' : '#ccc',
                  color: 'white',
                  cursor: newNodeLabel.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Create Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}