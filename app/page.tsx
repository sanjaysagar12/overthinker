"use client";
import { useEffect, useState } from 'react';
import FlowGraph from './components/FlowGraph';

type NodeType = { id: string; position: { x: number; y: number }; data: { label: string }; type?: string };
type EdgeType = { id: string; source: string; target: string; animated: boolean };

export default function App() {
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<EdgeType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/get-nodes');
        const data = await response.json();
        console.log('Fetched data:', data);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      } catch (error) {
        console.error('Error fetching nodes:', error);
        // Set empty arrays on error
        setNodes([]);
        setEdges([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  console.log('App render:', { nodes: nodes?.length, edges: edges?.length, loading });

  if (loading) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        Loading...
      </div>
    );
  }

  return <FlowGraph initialNodes={nodes} initialEdges={edges} />;
}