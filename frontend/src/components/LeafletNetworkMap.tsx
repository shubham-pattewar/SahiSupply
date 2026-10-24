import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { NetworkNode, AllocationRecommendation, InventoryBatch } from '../types';
import { Warehouse, Store, Truck, ShieldCheck, AlertTriangle } from 'lucide-react';

interface LeafletNetworkMapProps {
  nodes: {
    cwhs: NetworkNode[];
    rdcs: NetworkNode[];
    destinations: NetworkNode[];
  };
  recommendations: AllocationRecommendation[];
  batches: InventoryBatch[];
}

// Custom Leaflet DivIcon Creators
const createNodeIcon = (type: string, color: string) => {
  const isCwh = type.includes('Central');
  const size = isCwh ? 28 : (type.includes('Regional') ? 22 : 16);

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 12px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        ${isCwh ? `<div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; border: 1.5px solid ${color}; opacity: 0.6;" class="radar-pulse-ring"></div>` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export const LeafletNetworkMap: React.FC<LeafletNetworkMapProps> = ({
  nodes,
  recommendations,
  batches
}) => {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(nodes.cwhs[0] || null);

  const allNodes = [...nodes.cwhs, ...nodes.rdcs, ...nodes.destinations];

  // Incoming and outbound dispatches for selected node
  const incoming = recommendations.filter(r => r.destination_id === selectedNode?.id);
  const outbound = recommendations.filter(r => r.origin_id === selectedNode?.id);
  const nodeBatches = batches.filter(b => b.warehouse_id === selectedNode?.id);
  const criticalBatches = nodeBatches.filter(b => b.status === 'CRITICAL_FEFO');

  // Center on India
  const centerPosition: [number, number] = [21.5, 79.0];

  const getRouteColor = (rec: AllocationRecommendation) => {
    if (rec.transport_mode.includes('Cold')) return '#38bdf8';
    if (rec.category === 'Cosmetics') return '#e879f9';
    if (rec.category === 'Pharmaceuticals') return '#06b6d4';
    return '#10b981';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Interactive Leaflet Map Container */}
      <div className="lg:col-span-2 glass-panel p-4 rounded-xl border border-white/10 relative h-[640px] flex flex-col">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>Multi-Tier Supply Chain Geospatial Topology</span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive OpenStreetMap rendering 28 hubs across India with live allocation flow lines
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span>Central Plant</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Regional Depot</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Retail / Dark Store</span>
            </span>
          </div>
        </div>

        {/* Industry Sector Route Legend */}
        <div className="flex flex-wrap items-center gap-3 mb-2.5 pt-1.5 border-t border-white/10 text-xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Sector Dispatch Corridors:</span>
          <span className="flex items-center gap-1.5 text-pink-300 font-medium">
            <span className="w-3.5 h-1 bg-pink-400 inline-block rounded-full"></span>
            <span>💄 Cosmetics</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <span className="w-3.5 h-1 bg-emerald-400 inline-block rounded-full"></span>
            <span>🛒 Groceries</span>
          </span>
          <span className="flex items-center gap-1.5 text-sky-300 font-medium">
            <span className="w-3.5 h-1 bg-sky-400 inline-block rounded-full"></span>
            <span>💊 Pharmaceuticals</span>
          </span>
          <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-cyan-400 inline-block"></span>
            <span>❄️ Reefer Cold-Chain</span>
          </span>
          <span className="ml-auto text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            {recommendations.length} Active Shipments
          </span>
        </div>

        <div className="flex-1 w-full rounded-lg overflow-hidden border border-white/10 relative">
          <MapContainer
            center={centerPosition}
            zoom={5}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            {/* OpenStreetMap Tile Layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Shipment Flow Arcs / Polylines filtered by Sector */}
            {recommendations.slice(0, 80).map((rec, i) => {
              const orig = allNodes.find(n => n.id === rec.origin_id);
              const dest = allNodes.find(n => n.id === rec.destination_id);
              if (!orig || !dest) return null;

              const isCold = rec.transport_mode.includes('Cold');
              const positions: [number, number][] = [
                [orig.lat, orig.lng],
                [dest.lat, dest.lng]
              ];

              return (
                <Polyline
                  key={`route-${rec.id}-${i}`}
                  positions={positions}
                  pathOptions={{
                    color: getRouteColor(rec),
                    weight: isCold ? 2.5 : 1.5,
                    opacity: 0.45,
                    dashArray: isCold ? '5, 5' : undefined
                  }}
                />
              );
            })}

            {/* Central Warehouses (CWH) */}
            {nodes.cwhs.map(node => (
              <Marker
                key={node.id}
                position={[node.lat, node.lng]}
                icon={createNodeIcon(node.type, '#38bdf8')}
                eventHandlers={{
                  click: () => setSelectedNode(node)
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <strong className="text-cyan-400 block text-sm">{node.name}</strong>
                    <div className="text-slate-300 mt-1">{node.type} | {node.city}</div>
                    <div className="text-emerald-400 font-mono mt-0.5">
                      Capacity: {node.storage_capacity_units.toLocaleString()} units
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Regional Distribution Centers (RDC) */}
            {nodes.rdcs.map(node => (
              <Marker
                key={node.id}
                position={[node.lat, node.lng]}
                icon={createNodeIcon(node.type, '#f59e0b')}
                eventHandlers={{
                  click: () => setSelectedNode(node)
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <strong className="text-amber-400 block">{node.name}</strong>
                    <div className="text-slate-300">{node.city}, {node.state}</div>
                    <div className="text-slate-400 mt-0.5">
                      Throughput: {node.daily_throughput_capacity.toLocaleString()} units/day
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Destination Retail Outlets / Dark Stores */}
            {nodes.destinations.map(node => (
              <Marker
                key={node.id}
                position={[node.lat, node.lng]}
                icon={createNodeIcon(node.type, '#10b981')}
                eventHandlers={{
                  click: () => setSelectedNode(node)
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <strong className="text-emerald-400 block">{node.name}</strong>
                    <div className="text-slate-300">{node.type} | {node.city}</div>
                    <div className="text-slate-400">
                      Capacity: {node.storage_capacity_units.toLocaleString()} units
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* 2. Selected Node Telemetry Inspector */}
      <div className="glass-panel p-5 rounded-xl border border-white/10 flex flex-col justify-between h-[620px]">
        <div>
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Node Telemetry Inspector
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
              {selectedNode?.id}
            </span>
          </div>

          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                  {selectedNode.type}
                </span>
                <h4 className="text-lg font-bold text-white mt-0.5">{selectedNode.name}</h4>
                <p className="text-xs text-slate-400">{selectedNode.city}, {selectedNode.state}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 block">Storage Capacity</span>
                  <span className="text-base font-bold font-mono text-white">
                    {selectedNode.storage_capacity_units.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-400 block">Daily Throughput</span>
                  <span className="text-base font-bold font-mono text-white">
                    {selectedNode.daily_throughput_capacity.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Incoming Dispatches */}
              {incoming.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                    <Store className="w-3.5 h-3.5" />
                    <span>Incoming Replenishment ({incoming.length} consignments)</span>
                  </h5>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {incoming.slice(0, 6).map(r => (
                      <div key={r.id} className="text-xs p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-slate-200 flex justify-between">
                        <span>{r.product_name}</span>
                        <strong className="font-mono text-emerald-400">{r.quantity_units.toLocaleString()} u</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outbound Dispatches */}
              {outbound.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 mb-2">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Outbound Allocations ({outbound.length} shipments)</span>
                  </h5>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {outbound.slice(0, 6).map(r => (
                      <div key={r.id} className="text-xs p-2 rounded bg-cyan-500/10 border border-cyan-500/20 text-slate-200 flex justify-between">
                        <span>{r.product_name} ➔ {r.destination_name.split(' ')[0]}</span>
                        <strong className="font-mono text-cyan-400">{r.quantity_units.toLocaleString()} u</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Batches on-hand */}
              {nodeBatches.length > 0 && (
                <div className="pt-2 border-t border-white/10 text-xs flex justify-between items-center text-slate-300">
                  <span>Warehouse Batches: <strong>{nodeBatches.length}</strong></span>
                  {criticalBatches.length > 0 ? (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {criticalBatches.length} Critical FEFO Batches
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Batches Healthy
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Click any node marker on the OpenStreetMap to inspect storage metrics.
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400 bg-white/5 p-2.5 rounded-lg border border-white/10 mt-4">
          💡 Click any node on the Leaflet map to inspect live incoming consignments, outbound dispatches, and warehouse batch health.
        </div>
      </div>
    </div>
  );
};
