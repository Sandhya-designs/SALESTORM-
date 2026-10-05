import React from 'react';
import type { SimulationTrafficSample } from '../../types';
import { Activity } from 'lucide-react';

interface TrafficSampleTableProps {
  samples: SimulationTrafficSample[];
}

export const TrafficSampleTable: React.FC<TrafficSampleTableProps> = ({ samples }) => {
  const getResultBadge = (result: SimulationTrafficSample['result']) => {
    switch (result) {
      case 'SUCCESS':
      case 'RESERVED':
        return <span className="sample-badge badge-emerald">RESERVED</span>;
      case 'RATE_LIMITED':
        return <span className="sample-badge badge-amber">RATE LIMITED</span>;
      case 'SOLD_OUT':
        return <span className="sample-badge badge-muted">SOLD OUT</span>;
      default:
        return <span className="sample-badge badge-cyan">{result}</span>;
    }
  };

  return (
    <div className="traffic-table-card">
      <div className="traffic-table-header">
        <div className="traffic-table-title">
          <Activity size={16} className="text-cyan" />
          <span>LIVE REQUEST TRAFFIC INSPECTION (SAMPLE)</span>
        </div>
        <div className="traffic-table-sub">Live telemetry stream (Last 10 frames)</div>
      </div>

      <div className="table-responsive">
        <table className="flash-table">
          <thead>
            <tr>
              <th>REQUEST ID</th>
              <th>CUSTOMER / THREAD</th>
              <th>TIMESTAMP</th>
              <th>PIPELINE STAGE</th>
              <th>OUTCOME</th>
              <th>LATENCY</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((sample) => (
              <tr key={sample.id}>
                <td className="font-mono text-cyan">{sample.id}</td>
                <td className="font-mono">{sample.userId}</td>
                <td className="font-mono text-muted">{sample.timestamp}</td>
                <td>
                  <span className="stage-pill">{sample.stage}</span>
                </td>
                <td>{getResultBadge(sample.result)}</td>
                <td className="font-mono text-emerald">{sample.latencyMs} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
