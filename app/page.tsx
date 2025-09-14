"use client";
import initialNodesData from './initialNodes.json';
import FlowGraph from './FlowGraph';

const initialNodes = initialNodesData.nodes;
const initialEdges = initialNodesData.edges;

export default function App() {
  return <FlowGraph initialNodes={initialNodes} initialEdges={initialEdges} />;
}