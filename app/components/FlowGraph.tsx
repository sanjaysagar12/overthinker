"use client";
import { useEffect, useCallback } from 'react';
import { ReactFlow, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Components
import ScenarioInputModal from './modals/ScenarioInputModal';
import QuestionsModal from './modals/QuestionsModal';
import OutcomeModal from './modals/OutcomeModal';

// Hooks
import { useAIWorkflow } from '../hooks/useAIWorkflow';
import { useFlowGraph } from '../hooks/useFlowGraph';

type NodeType = { id: string; position: { x: number; y: number }; data: { label: string }; type?: string };
type EdgeType = { id: string; source: string; target: string; animated: boolean };

interface FlowGraphProps {
  initialNodes: NodeType[];
  initialEdges: EdgeType[];
}

export default function FlowGraph({ initialNodes, initialEdges }: FlowGraphProps) {
  // AI Workflow hook
  const {
    scenario,
    aiQuestions,
    currentQuestionIndex,
    questionAnswers,
    currentAnswer,
    outcomeAnalysis,
    loading,
    showScenarioInput,
    showQuestions,
    showOutcome,
    setScenario,
    setCurrentAnswer,
    startScenarioInput,
    generateQuestions,
    submitAnswer,
    resetWorkflow,
  } = useAIWorkflow();

  // Flow Graph hook
  const {
    nodes,
    edges,
    selectedNode,
    setSelectedNode,
    onNodesChange,
    onEdgesChange,
    createFlowFromOutcome,
  } = useFlowGraph(initialNodes, initialEdges);

  // Check if nodes array is empty and show scenario input for AI integration
  useEffect(() => {
    if (nodes && nodes.length === 0 && !showScenarioInput && !showQuestions) {
      setTimeout(() => {
        startScenarioInput();
      }, 100);
    }
  }, [nodes?.length, showScenarioInput, showQuestions, startScenarioInput]);

  // Handle node clicks
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const nodeData = node as NodeType;
    setSelectedNode(nodeData);
    
    // Start AI workflow for existing nodes
    generateQuestions(nodeData.data.label);
  }, [setSelectedNode, generateQuestions]);

  // Handle scenario submission
  const handleScenarioSubmit = useCallback(() => {
    if (scenario.trim()) {
      generateQuestions(scenario.trim());
    }
  }, [scenario, generateQuestions]);

  // Handle flow chart creation from outcomes
  const handleCreateFlowChart = useCallback(() => {
    if (outcomeAnalysis) {
      const isFirstNode = nodes.length === 0;
      const scenarioText = isFirstNode ? scenario : selectedNode?.data.label || '';
      createFlowFromOutcome(scenarioText, outcomeAnalysis, isFirstNode);
    }
    resetWorkflow();
  }, [outcomeAnalysis, nodes.length, scenario, selectedNode, createFlowFromOutcome, resetWorkflow]);

  // Prevent manual edge connections
  const onConnect = useCallback(() => {
    return; // Disable manual edge creation
  }, []);

  return (
    <div className="w-screen h-screen">
      {/* Empty state message */}
      {nodes && nodes.length === 0 && !showScenarioInput && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-gray-600 text-lg z-10">
          <div>No flow found</div>
          <div className="text-sm mt-2">
            Initializing AI-powered flow creation...
          </div>
        </div>
      )}
      
      {/* ReactFlow Canvas */}
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
      
      {/* Modals */}
      <ScenarioInputModal
        isOpen={showScenarioInput}
        scenario={scenario}
        loading={loading}
        onScenarioChange={setScenario}
        onSubmit={handleScenarioSubmit}
      />

      <QuestionsModal
        isOpen={showQuestions}
        questions={aiQuestions}
        currentQuestionIndex={currentQuestionIndex}
        currentAnswer={currentAnswer}
        questionAnswers={questionAnswers}
        loading={loading}
        onAnswerChange={setCurrentAnswer}
        onSubmitAnswer={submitAnswer}
        onCancel={resetWorkflow}
      />

      <OutcomeModal
        isOpen={showOutcome}
        analysis={outcomeAnalysis}
        onCreateFlowChart={handleCreateFlowChart}
        onStartOver={resetWorkflow}
      />
    </div>
  );
}