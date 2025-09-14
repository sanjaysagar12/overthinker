"use client";
import { useState, useCallback, useEffect } from 'react';
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
  const [isCreatingFirstNode, setIsCreatingFirstNode] = useState(false);

  // Check if nodes array is empty and show popup for first node creation
  useEffect(() => {
    console.log('Nodes check:', { nodes: nodes?.length, showPopup, isCreatingFirstNode });
    if (nodes && nodes.length === 0 && !showPopup) {
      console.log('Setting up first node creation');
      // Small delay to ensure UI is ready
      setTimeout(() => {
        setIsCreatingFirstNode(true);
        setShowPopup(true);
      }, 100);
    }
  }, [nodes?.length, showPopup]);

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
        // Update initialNodes.json with new positions
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
    if (!newNodeLabel.trim()) return;

    // Handle creating the first node when no nodes exist
    if (isCreatingFirstNode && (!nodes || nodes.length === 0)) {
      const firstNode: NodeType = {
        id: '1',
        position: { x: 400, y: 50 },
        data: { label: newNodeLabel.trim() },
        type: 'input'
      };

      const updatedNodes = [firstNode];
      const updatedEdges: EdgeType[] = [];

      // Update state
      setNodes(updatedNodes);
      setEdges(updatedEdges);

      // Save to file
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
      setIsCreatingFirstNode(false);
      return;
    }

    // Handle creating child nodes (existing functionality)
    if (!selectedNode) return;

    // Generate new node ID
    const newNodeId = String(nodes && nodes.length > 0 ? Math.max(...nodes.map(n => parseInt(n.id))) + 1 : 1);
    
    // Get existing children of the selected node
    const existingChildren = edges ? edges.filter(edge => edge.source === selectedNode.id) : [];
    const childrenCount = existingChildren.length;
    
    // Calculate position for new node with equal spacing
    const spacing = 200;
    const totalWidth = childrenCount * spacing;
    const startX = selectedNode.position.x - totalWidth / 2;
    const newX = startX + (childrenCount * spacing);
    const newY = selectedNode.position.y + 150;

    // Update positions of existing children to maintain equal spacing
    const childNodes = nodes ? nodes.filter(node => 
      existingChildren.some(edge => edge.target === node.id)
    ) : [];

    const updatedNodesWithSpacing = nodes ? nodes.map(node => {
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
    }) : [];

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

    const updatedEdges = edges ? [...edges, newEdge] : [newEdge];

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
  }, [selectedNode, newNodeLabel, nodes, edges, isCreatingFirstNode]);

  const handleCancelPopup = useCallback(() => {
    // If creating first node, don't allow cancel (user must create at least one node)
    if (isCreatingFirstNode) {
      return;
    }
    
    setShowPopup(false);
    setNewNodeLabel('');
    setSelectedNode(null);
  }, [isCreatingFirstNode]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* Show empty state message when no nodes and no popup */}
      {nodes && nodes.length === 0 && !showPopup && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#666',
          fontSize: '18px',
          zIndex: 10
        }}>
          <div>No nodes found</div>
          <div style={{ fontSize: '14px', marginTop: '10px' }}>
            Initializing first node creation...
          </div>
        </div>
      )}
      
      <ReactFlow
        nodes={nodes || []}
        edges={edges || []}
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
            <h3 style={{ margin: '0 0 15px 0' }}>
              {isCreatingFirstNode ? 'Create Your First Node' : 'Add New Node'}
            </h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
              {isCreatingFirstNode 
                ? 'Start building your flow by creating the first node'
                : `Creating child node for: ${selectedNode?.data.label}`
              }
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
              {!isCreatingFirstNode && (
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
              )}
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
                {isCreatingFirstNode ? 'Create First Node' : 'Create Node'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}