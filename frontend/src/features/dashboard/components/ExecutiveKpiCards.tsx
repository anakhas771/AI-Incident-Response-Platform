import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { ExecutiveKPIMetrics } from '../types';

interface ExecutiveKpiCardsProps {
  kpis: ExecutiveKPIMetrics;
  isLoading?: boolean;
}

/**
 * Animated number counter micro-component for smooth KPI transitions
 */
const AnimatedNumber: React.FC<{ value: number; decimals?: number; suffix?: string }> = ({
  value,
  decimals = 0,
  suffix = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 700;
    const stepTime = Math.max(Math.floor(duration / 30), 20);
    const increment = value / (duration / stepTime);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export const ExecutiveKpiCards: React.FC<ExecutiveKpiCardsProps> = ({
  kpis,
  isLoading = false,
}) => {
  if (isLoading) {
    return null; // Handled by DashboardSkeleton
  }

  const cards = [
    {
      title: 'Total Incidents',
      value: kpis.incidentCount,
      decimals: 0,
      suffix: '',
      icon: Activity,
      iconBg: 'bg-indigo-950/50 text-indigo-400 border-indigo-800/40',
      trend: {
        label: '+2 this week',
        isPositive: false,
        icon: TrendingUp,
      },
      subtitle: '24h Total Logged',
      ariaLabel: `Total incidents: ${kpis.incidentCount}`,
    },
    {
      title: 'Open Incidents',
      value: kpis.openIncidents,
      decimals: 0,
      suffix: '',
      icon: AlertTriangle,
      iconBg: 'bg-red-950/50 text-red-400 border-red-800/40',
      trend: {
        label: 'Active Queue',
        isPositive: kpis.openIncidents === 0,
        icon: kpis.openIncidents > 0 ? ShieldAlert : ShieldCheck,
      },
      subtitle: 'Requires investigation',
      ariaLabel: `Open incidents: ${kpis.openIncidents}`,
    },
    {
      title: 'Resolved Incidents',
      value: kpis.resolvedIncidents,
      decimals: 0,
      suffix: '',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40',
      trend: {
        label: `${kpis.incidentCount ? Math.round((kpis.resolvedIncidents / kpis.incidentCount) * 100) : 100}% rate`,
        isPositive: true,
        icon: TrendingUp,
      },
      subtitle: 'Closed or remediated',
      ariaLabel: `Resolved incidents: ${kpis.resolvedIncidents}`,
    },
    {
      title: 'MTTR (Resolution)',
      value: kpis.mttrMinutes,
      decimals: 1,
      suffix: 'm',
      icon: Clock,
      iconBg: 'bg-purple-950/50 text-purple-400 border-purple-800/40',
      trend: {
        label: `${kpis.mttrTrendPct}% vs last week`,
        isPositive: kpis.mttrTrendPct <= 0,
        icon: kpis.mttrTrendPct <= 0 ? TrendingDown : TrendingUp,
      },
      subtitle: 'Mean Time to Resolve',
      ariaLabel: `Mean time to resolution: ${kpis.mttrMinutes} minutes`,
    },
    {
      title: 'MTTD (Detection)',
      value: kpis.mttdMinutes,
      decimals: 1,
      suffix: 'm',
      icon: Clock,
      iconBg: 'bg-cyan-950/50 text-cyan-400 border-cyan-800/40',
      trend: {
        label: `${kpis.mttdTrendPct}% vs last week`,
        isPositive: kpis.mttdTrendPct <= 0,
        icon: kpis.mttdTrendPct <= 0 ? TrendingDown : TrendingUp,
      },
      subtitle: 'Mean Time to Detect',
      ariaLabel: `Mean time to detection: ${kpis.mttdMinutes} minutes`,
    },
    {
      title: 'SLA Compliance',
      value: kpis.slaCompliancePct,
      decimals: 1,
      suffix: '%',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40',
      trend: {
        label: `Target: 99.0%`,
        isPositive: kpis.slaCompliancePct >= 99.0,
        icon: kpis.slaCompliancePct >= 99.0 ? ShieldCheck : ShieldAlert,
      },
      subtitle: 'SLA target met',
      ariaLabel: `SLA compliance percentage: ${kpis.slaCompliancePct}%`,
    },
  ];

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      role="region"
      aria-label="Executive KPI Metrics"
    >
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        const TrendIcon = card.trend.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
          >
            <Card
              hoverEffect
              className="relative overflow-hidden h-full flex flex-col justify-between"
              aria-label={card.ariaLabel}
              tabIndex={0}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg border ${card.iconBg}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-zinc-100">
                  <AnimatedNumber
                    value={card.value}
                    decimals={card.decimals}
                    suffix={card.suffix}
                  />
                </span>
                <span
                  className={`text-xs font-mono flex items-center gap-1 ${
                    card.trend.isPositive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  <TrendIcon className="w-3 h-3" />
                  {card.trend.label}
                </span>
              </div>

              <p className="text-[11px] text-zinc-400 mt-1">{card.subtitle}</p>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ExecutiveKpiCards;
