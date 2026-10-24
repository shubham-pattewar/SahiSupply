import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Header } from '../components/Header';
import { TelemetryStrip } from '../components/TelemetryStrip';
import { SectionSelector } from '../components/SectionSelector';

describe('SahiSupply Frontend Components', () => {
  it('renders Header with branding, status pill, and action buttons', () => {
    render(
      <Header
        onReoptimize={vi.fn()}
        onBatchDispatch={vi.fn()}
        onExportCsv={vi.fn()}
        onOpenAudit={vi.fn()}
        theme="dark"
        onToggleTheme={vi.fn()}
        isDbMock={false}
      />
    );

    expect(screen.getByText('SahiSupply™ AI')).toBeInTheDocument();
    expect(screen.getByText('OR-Tools MIP & FEFO Active')).toBeInTheDocument();
    expect(screen.getByText('Audit Constraints')).toBeInTheDocument();
    expect(screen.getByText('Batch Dispatch All')).toBeInTheDocument();
    expect(screen.getByText('Export Manifest')).toBeInTheDocument();
  });

  it('renders TelemetryStrip with key metrics correctly', () => {
    const mockMetrics = {
      total_network_demand: 120000,
      total_allocated_units: 113400,
      unmet_stockout_units: 6600,
      stockout_rate_pct: 5.5,
      fulfillment_rate_pct: 94.5,
      total_freight_cost: 2850000,
      cost_per_unit_shipped: 2.12,
      inventory_at_risk_units: 3200,
      wastage_prevented_units: 4280,
      wastage_loss_saved_value: 1245000,
      fefo_compliance_pct: 100.0,
      total_carbon_emission_kg: 14210,
      savings_vs_baseline_pct: 28.4,
      cost_saved_vs_baseline: 4620000,
      stockout_reduction_pct: 78.0,
      waste_reduction_pct: 77.4
    };

    render(<TelemetryStrip metrics={mockMetrics} />);

    expect(screen.getByText('94.5%')).toBeInTheDocument();
    expect(screen.getByText('5.5%')).toBeInTheDocument();
    expect(screen.getByText('₹12.45L')).toBeInTheDocument();
    expect(screen.getByText('₹28.50L')).toBeInTheDocument();
    expect(screen.getByText('₹46.20L')).toBeInTheDocument();
  });

  it('renders SectionSelector with Cosmetics, Groceries, and Pharmaceuticals tabs', () => {
    const mockSections = [
      {
        id: 'Cosmetics',
        name: 'Cosmetics & Personal Care',
        tagline: 'High Margin & Beauty Campaign Lift',
        icon: 'Sparkles',
        color: 'rose',
        description: 'Beauty serums and skincare',
        sku_count: 5,
        cold_chain_required: false,
        characteristics: ['High retail margin']
      },
      {
        id: 'Groceries',
        name: 'Groceries & Fresh Dairy',
        tagline: 'Perishable Velocity',
        icon: 'ShoppingCart',
        color: 'emerald',
        description: 'Fresh dairy and juices',
        sku_count: 5,
        cold_chain_required: true,
        characteristics: ['Cold-chain reefer']
      },
      {
        id: 'Pharmaceuticals',
        name: 'Pharmaceuticals & Healthcare',
        tagline: 'Strict Regulatory',
        icon: 'Pill',
        color: 'sky',
        description: 'Essential medicines',
        sku_count: 5,
        cold_chain_required: true,
        characteristics: ['2-8C cold chain']
      }
    ];

    const onSelect = vi.fn();
    render(
      <SectionSelector
        activeSection="All"
        onSelectSection={onSelect}
        sections={mockSections}
        orderCounts={{ all: 48, cosmetics: 14, groceries: 18, pharmaceuticals: 16 }}
      />
    );

    expect(screen.getByText('All Sectors')).toBeInTheDocument();
    expect(screen.getByText('Cosmetics')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Pharmaceuticals')).toBeInTheDocument();
    expect(screen.getByText('14 Orders')).toBeInTheDocument();
    expect(screen.getByText('18 Orders')).toBeInTheDocument();
    expect(screen.getByText('16 Orders')).toBeInTheDocument();
  });
});

