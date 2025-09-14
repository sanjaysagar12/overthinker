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
  const [showScenarioInput, setShowScenarioInput] = useState(false);
  const [scenario, setScenario] = useState('');
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showOutcome, setShowOutcome] = useState(false);
  const [outcomeAnalysis, setOutcomeAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Check if nodes array is empty and show scenario input for AI integration
  useEffect(() => {
    console.log('Nodes check:', { nodes: nodes?.length, showPopup, isCreatingFirstNode });
    if (nodes && nodes.length === 0 && !showPopup && !showScenarioInput) {
      console.log('Setting up scenario input for AI integration');
      // Small delay to ensure UI is ready
      setTimeout(() => {
        setShowScenarioInput(true);
      }, 100);
    }
  }, [nodes?.length, showPopup, showScenarioInput]);

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
    // Start AI workflow for existing nodes
    startAIWorkflow(node as NodeType);
  }, []);

  const startAIWorkflow = useCallback(async (node: NodeType) => {
    setLoading(true);
    setCurrentQuestionIndex(0);
    setQuestionAnswers([]);
    setCurrentAnswer('');
    
    try {
      // Generate questions based on the node label/scenario
      const response = await fetch('/api/ai/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenario: node.data.label }),
      });

      const data = await response.json();
      if (data.success) {
        setAiQuestions(data.questions);
        setShowPopup(true);
      } else {
        console.error('Failed to generate questions:', data.error);
        // Fallback to simple node creation
        setShowPopup(true);
      }
    } catch (error) {
      console.error('Error calling AI:', error);
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleScenarioSubmit = useCallback(async () => {
    if (!scenario.trim()) return;
    
    setLoading(true);
    try {
      // Generate questions based on scenario
      const response = await fetch('/api/ai/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenario: scenario.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        setAiQuestions(data.questions);
        setCurrentQuestionIndex(0);
        setQuestionAnswers([]);
        setCurrentAnswer('');
        setShowScenarioInput(false);
        setIsCreatingFirstNode(true);
        setShowPopup(true);
      } else {
        console.error('Failed to generate questions:', data.error);
      }
    } catch (error) {
      console.error('Error calling AI:', error);
    } finally {
      setLoading(false);
    }
  }, [scenario]);

  const handleAnswerSubmit = useCallback(() => {
    if (!currentAnswer.trim()) return;

    const updatedAnswers = [...questionAnswers, currentAnswer.trim()];
    setQuestionAnswers(updatedAnswers);
    setCurrentAnswer('');

    if (currentQuestionIndex < aiQuestions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, get outcome prediction
      predictOutcomes(updatedAnswers);
    }
  }, [currentAnswer, questionAnswers, currentQuestionIndex, aiQuestions]);

  const predictOutcomes = useCallback(async (answers: string[]) => {
    setLoading(true);
    try {
      // Combine scenario and answers for outcome prediction
      const fullPrompt = isCreatingFirstNode 
        ? `${scenario}. Additional context: ${answers.join(' ')}`
        : `${selectedNode?.data.label}. Additional context: ${answers.join(' ')}`;

      const response = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: fullPrompt }),
      });

      const data = await response.json();
      if (data.success) {
        setOutcomeAnalysis(data.analysis);
        setShowOutcome(true);
      } else {
        console.error('Failed to predict outcomes:', data.error);
      }
    } catch (error) {
      console.error('Error predicting outcomes:', error);
    } finally {
      setLoading(false);
    }
  }, [scenario, selectedNode, isCreatingFirstNode]);

  const handleCreateNodeWithOutcome = useCallback(async () => {
    const nodeLabel = isCreatingFirstNode ? scenario : selectedNode?.data.label || 'Node';
    
    if (isCreatingFirstNode) {
      // Create first node with scenario as label
      const firstNode: NodeType = {
        id: '1',
        position: { x: 400, y: 50 },
        data: { label: scenario.substring(0, 50) + (scenario.length > 50 ? '...' : '') },
        type: 'input'
      };

      // Create outcome nodes directly without category nodes
      const outcomeNodes: NodeType[] = [];
      const outcomeEdges: EdgeType[] = [];
      let nodeId = 2;
      let xPosition = 100; // Starting x position

      // Create nodes directly from positive outcomes with animation
      if (outcomeAnalysis?.positive_outcomes) {
        outcomeAnalysis.positive_outcomes.forEach((outcome: string, index: number) => {
          const outcomeNode: NodeType = {
            id: String(nodeId++),
            position: { x: xPosition + (index * 200), y: 200 },
            data: { label: outcome.substring(0, 40) + (outcome.length > 40 ? '...' : '') },
            type: 'output'
          };
          outcomeNodes.push(outcomeNode);
          outcomeEdges.push({
            id: `e1-${outcomeNode.id}`,
            source: '1',
            target: outcomeNode.id,
            animated: true // Animation for positive outcomes
          });
        });
        
        // Update x position for next set of nodes
        xPosition += outcomeAnalysis.positive_outcomes.length * 200 + 100;
      }

      // Create nodes directly from negative outcomes without animation
      if (outcomeAnalysis?.negative_outcomes) {
        outcomeAnalysis.negative_outcomes.forEach((outcome: string, index: number) => {
          const outcomeNode: NodeType = {
            id: String(nodeId++),
            position: { x: xPosition + (index * 200), y: 200 },
            data: { label: outcome.substring(0, 40) + (outcome.length > 40 ? '...' : '') },
            type: 'output'
          };
          outcomeNodes.push(outcomeNode);
          outcomeEdges.push({
            id: `e1-${outcomeNode.id}`,
            source: '1',
            target: outcomeNode.id,
            animated: false // No animation for negative outcomes
          });
        });
      }

      const allNodes = [firstNode, ...outcomeNodes];
      const allEdges = outcomeEdges;

      // Update state
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

      // Generate new node IDs starting from the highest existing ID
      let nodeId = Math.max(...nodes.map(n => parseInt(n.id))) + 1;
      const newNodes: NodeType[] = [];
      const newEdges: EdgeType[] = [];
      
      // Calculate position for child nodes
      const baseY = selectedNode.position.y + 150;
      let xPosition = selectedNode.position.x - 200; // Start to the left of parent

      // Create child nodes from positive outcomes with animation
      if (outcomeAnalysis?.positive_outcomes) {
        outcomeAnalysis.positive_outcomes.forEach((outcome: string, index: number) => {
          const childNode: NodeType = {
            id: String(nodeId++),
            position: { x: xPosition + (index * 180), y: baseY },
            data: { label: outcome.substring(0, 35) + (outcome.length > 35 ? '...' : '') },
            type: 'output'
          };
          newNodes.push(childNode);
          newEdges.push({
            id: `e${selectedNode.id}-${childNode.id}`,
            source: selectedNode.id,
            target: childNode.id,
            animated: true // Animation for positive outcomes
          });
        });
        
        // Update x position for negative outcomes
        xPosition += outcomeAnalysis.positive_outcomes.length * 180 + 50;
      }

      // Create child nodes from negative outcomes without animation
      if (outcomeAnalysis?.negative_outcomes) {
        outcomeAnalysis.negative_outcomes.forEach((outcome: string, index: number) => {
          const childNode: NodeType = {
            id: String(nodeId++),
            position: { x: xPosition + (index * 180), y: baseY },
            data: { label: outcome.substring(0, 35) + (outcome.length > 35 ? '...' : '') },
            type: 'output'
          };
          newNodes.push(childNode);
          newEdges.push({
            id: `e${selectedNode.id}-${childNode.id}`,
            source: selectedNode.id,
            target: childNode.id,
            animated: false // No animation for negative outcomes
          });
        });
      }

      // Update selected node type to 'default' if it was 'output'
      const updatedNodes = nodes.map(node => 
        node.id === selectedNode.id && node.type === 'output'
          ? { ...node, type: 'default' }
          : node
      );

      // Add new nodes to existing nodes
      const allNodes = [...updatedNodes, ...newNodes];
      const allEdges = [...edges, ...newEdges];

      // Update state
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

    // Reset all states
    resetAIStates();
  }, [scenario, selectedNode, isCreatingFirstNode, outcomeAnalysis, nodes, edges]);

  const resetAIStates = useCallback(() => {
    setShowPopup(false);
    setShowScenarioInput(false);
    setShowOutcome(false);
    setScenario('');
    setAiQuestions([]);
    setCurrentQuestionIndex(0);
    setQuestionAnswers([]);
    setCurrentAnswer('');
    setSelectedNode(null);
    setIsCreatingFirstNode(false);
    setOutcomeAnalysis(null);
    setNewNodeLabel('');
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
    <div className="w-screen h-screen">
      {/* Show empty state message when no nodes and no scenario input */}
      {nodes && nodes.length === 0 && !showScenarioInput && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-gray-600 text-lg z-10">
          <div>No flow found</div>
          <div className="text-sm mt-2">
            Initializing AI-powered flow creation...
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
      
      {/* Scenario Input Modal */}
      {showScenarioInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-[90%]">
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-5">
              🚀 Start Your AI-Powered Decision Flow
            </h3>
            <p className="text-base text-gray-600 text-center mb-5">
              Describe your situation or decision, and I'll help you explore it with questions and outcome predictions
            </p>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="Describe your scenario, situation, or decision you're facing..."
              className="w-full h-30 p-4 border-2 border-gray-200 rounded-lg text-base resize-y font-inherit focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-4 mt-5">
              <button
                onClick={handleScenarioSubmit}
                disabled={loading || !scenario.trim()}
                className={`px-8 py-3 border-none rounded-lg text-base font-bold transition-colors ${
                  loading || !scenario.trim() 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
                }`}
              >
                {loading ? 'Analyzing...' : 'Start AI Analysis'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions & Answers Modal */}
      {showPopup && aiQuestions.length > 0 && !showOutcome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-3xl w-[90%]">
            <h3 className="text-xl font-semibold text-gray-800 mb-5">
              🤔 Question {currentQuestionIndex + 1} of {aiQuestions.length}
            </h3>
            <div className="bg-gray-50 p-5 rounded-lg mb-5 border border-gray-200">
              <p className="text-base text-gray-800 leading-relaxed m-0">
                {aiQuestions[currentQuestionIndex]}
              </p>
            </div>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Share your thoughts and insights..."
              className="w-full h-30 p-4 border-2 border-gray-200 rounded-lg text-sm resize-y font-inherit focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <div className="flex justify-between items-center mt-5">
              <div className="text-gray-600 text-sm">
                Progress: {questionAnswers.length}/{aiQuestions.length} answered
              </div>
              <div className="flex gap-3">
                <button
                  onClick={resetAIStates}
                  className="px-5 py-2 border border-gray-300 rounded bg-white text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAnswerSubmit}
                  disabled={!currentAnswer.trim() || loading}
                  className={`px-6 py-2 border-none rounded font-bold transition-colors ${
                    !currentAnswer.trim() || loading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Processing...' : (currentQuestionIndex < aiQuestions.length - 1 ? 'Next Question' : 'Predict Outcomes')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outcome Display Modal */}
      {showOutcome && outcomeAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-4xl w-[90%] max-h-[80vh] overflow-auto">
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-5">
              🔮 Predicted Outcomes
            </h3>
            
            {outcomeAnalysis.analysis_summary && (
              <div className="bg-blue-50 p-4 rounded-lg mb-5 border border-blue-200">
                <p className="text-blue-800 text-sm m-0">
                  {outcomeAnalysis.analysis_summary}
                </p>
              </div>
            )}

            <div className="space-y-3 mb-5">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-gray-800 font-semibold mb-3 m-0">📋 All Outcomes</h4>
                <div className="space-y-2">
                  {/* Positive outcomes with animation */}
                  {outcomeAnalysis.positive_outcomes?.map((outcome: string, index: number) => (
                    <div 
                      key={`positive-${index}`} 
                      className="positive-outcome flex items-start gap-2 p-3 rounded-lg bg-green-50 border-l-4 border-green-500 hover:bg-green-100 transition-all duration-300"
                    >
                      <span className="text-green-600 font-bold text-base">✨</span>
                      <span className="text-green-800 text-sm flex-1 font-medium">
                        {outcome}
                      </span>
                    </div>
                  ))}
                  
                  {/* Negative outcomes without animation */}
                  {outcomeAnalysis.negative_outcomes?.map((outcome: string, index: number) => (
                    <div 
                      key={`negative-${index}`} 
                      className="flex items-start gap-2 p-2 rounded bg-red-50 border-l-4 border-red-500 hover:bg-red-100 transition-colors duration-200"
                    >
                      <span className="text-red-600 font-bold text-sm">⚠️</span>
                      <span className="text-red-800 text-sm flex-1">
                        {outcome}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={resetAIStates}
                className="px-6 py-3 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={handleCreateNodeWithOutcome}
                className="px-8 py-3 border-none rounded-lg bg-blue-600 text-white font-bold cursor-pointer hover:bg-blue-700 transition-colors"
              >
                Create Flow Chart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}