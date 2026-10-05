import React from 'react';
import { BarChart3, TrendingUp, CreditCard, Filter, Package } from 'lucide-react';

interface ObservabilityChartsProps {
  chartData: {
    trafficPoints: { time: string; requests: number; capacity: number }[];
    reservationOutcomes: { name: string; count: number; color: string }[];
    paymentOutcomes: { name: string; count: number; color: string }[];
    orderConversionFunnel: { stage: string; count: number; rate: number }[];
    inventoryHistory: { time: string; available: number; reserved: number; sold: number }[];
  };
}

export const ObservabilityCharts: React.FC<ObservabilityChartsProps> = ({ chartData }) => {
  const {
    trafficPoints,
    reservationOutcomes,
    paymentOutcomes,
    orderConversionFunnel,
    inventoryHistory,
  } = chartData;

  const maxTraffic = Math.max(...trafficPoints.map((p) => p.requests), 10000);

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', marginBottom: '18px' }}>
        {/* Chart 1: Request Traffic Over Time */}
        <div className="traffic-table-card" style={{ padding: '16px' }}>
          <div className="traffic-table-header" style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={16} className="text-cyan" />
              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                1. REQUEST TRAFFIC &amp; RATE-LIMIT CEILING
              </span>
            </div>
            <span className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>
              Peak 10,000 req burst
            </span>
          </div>

          <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', gap: '14px', padding: '10px 0' }}>
            {trafficPoints.map((pt, idx) => {
              const heightPct = Math.max(8, Math.round((pt.requests / maxTraffic) * 100));
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                  <span className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)' }}>
                    {pt.requests >= 1000 ? `${(pt.requests / 1000).toFixed(1)}k` : pt.requests}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${heightPct}%`,
                      backgroundColor: 'rgba(56, 189, 248, 0.4)',
                      border: '1px solid var(--accent-cyan)',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.4s ease',
                    }}
                  />
                  <span className="font-mono text-muted" style={{ fontSize: '0.65rem' }}>{pt.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Order Conversion Funnel */}
        <div className="traffic-table-card" style={{ padding: '16px' }}>
          <div className="traffic-table-header" style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} className="text-purple" />
              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                2. ORDER CONVERSION PIPELINE (FUNNEL)
              </span>
            </div>
            <span className="font-mono text-muted" style={{ fontSize: '0.72rem' }}>
              Requests → Reserved → Paid → Ordered
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {orderConversionFunnel.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.stage}</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>
                    {item.count.toLocaleString()} ({item.rate}%)
                  </span>
                </div>
                <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.max(2, item.rate)}%`,
                      backgroundColor: idx === 0 ? 'var(--accent-cyan)' : idx === 1 ? 'var(--accent-emerald)' : idx === 2 ? 'var(--accent-purple)' : '#38bdf8',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: 3 Sub-charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
        {/* Chart 3: Reservation Outcomes */}
        <div className="traffic-table-card" style={{ padding: '16px' }}>
          <div className="traffic-table-header" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={15} className="text-emerald" />
              <span style={{ fontWeight: 800, fontSize: '0.82rem' }}>3. RESERVATION OUTCOMES</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reservationOutcomes.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>{item.name}</span>
                </div>
                <span className="font-mono font-bold" style={{ fontSize: '0.82rem', color: item.color }}>
                  {item.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Payment Outcomes */}
        <div className="traffic-table-card" style={{ padding: '16px' }}>
          <div className="traffic-table-header" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={15} className="text-emerald" />
              <span style={{ fontWeight: 800, fontSize: '0.82rem' }}>4. PAYMENT GATEWAY OUTCOMES</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {paymentOutcomes.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>{item.name}</span>
                </div>
                <span className="font-mono font-bold" style={{ fontSize: '0.82rem', color: item.color }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 5: Inventory Balance Over Time */}
        <div className="traffic-table-card" style={{ padding: '16px' }}>
          <div className="traffic-table-header" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={15} className="text-cyan" />
              <span style={{ fontWeight: 800, fontSize: '0.82rem' }}>5. INVENTORY OVER TIME</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {inventoryHistory.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                <span className="text-muted" style={{ width: '50px' }}>{item.time}</span>
                <div style={{ flex: 1, display: 'flex', height: '10px', borderRadius: '3px', overflow: 'hidden', margin: '0 8px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ width: `${item.available}%`, backgroundColor: 'var(--accent-cyan)' }} title={`Available: ${item.available}`} />
                  <div style={{ width: `${item.reserved}%`, backgroundColor: 'var(--accent-amber)' }} title={`Reserved: ${item.reserved}`} />
                  <div style={{ width: `${item.sold}%`, backgroundColor: 'var(--accent-emerald)' }} title={`Sold: ${item.sold}`} />
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                  {item.available}A / {item.reserved}R / {item.sold}S
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
