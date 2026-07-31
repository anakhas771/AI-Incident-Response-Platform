import { ActivityLogItem, Incident, Organization, SystemMetrics, User } from '../types';

export const mockOrganization: Organization = {
  id: 'org-1001-cyber',
  name: 'Acme CyberSec Global',
  slug: 'acme-cybersec',
  description: 'Enterprise Tier Multi-Cloud Defense Command',
  is_active: true,
  created_at: '2025-01-15T08:00:00Z',
  users_count: 42,
};

export const mockUsers: User[] = [
  {
    id: 'user-001',
    email: 'alex.chen@acme-security.io',
    first_name: 'Alex',
    last_name: 'Chen',
    full_name: 'Alex Chen',
    role: 'ADMIN',
    organization: mockOrganization,
    phone_number: '+1 (555) 234-5678',
    is_active: true,
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    date_joined: '2025-02-01T10:00:00Z',
  },
  {
    id: 'user-002',
    email: 'sarah.jenkins@acme-security.io',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    full_name: 'Sarah Jenkins',
    role: 'ANALYST',
    organization: mockOrganization,
    phone_number: '+1 (555) 876-5432',
    is_active: true,
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    date_joined: '2025-03-10T14:30:00Z',
  },
  {
    id: 'user-003',
    email: 'marcus.vance@acme-security.io',
    first_name: 'Marcus',
    last_name: 'Vance',
    full_name: 'Marcus Vance',
    role: 'RESPONDER',
    organization: mockOrganization,
    phone_number: '+1 (555) 345-6789',
    is_active: true,
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    date_joined: '2025-04-12T09:15:00Z',
  },
  {
    id: 'user-004',
    email: 'elena.rostova@acme-security.io',
    first_name: 'Elena',
    last_name: 'Rostova',
    full_name: 'Elena Rostova',
    role: 'VIEWER',
    organization: mockOrganization,
    phone_number: '+1 (555) 987-6543',
    is_active: true,
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    date_joined: '2025-05-01T11:00:00Z',
  },
];

export const mockIncidents: Incident[] = [
  {
    id: 'inc-9081-01',
    title: 'Kubernetes Cluster Auth API Latency Spike & Pod Exhaustion',
    description:
      'High latency anomaly (>4500ms p99) detected on apiserver-pod-alpha in US-East-1. Automated horizontal pod autoscaler failing to stabilize load under SYN flood conditions.',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    category: 'Infrastructure',
    created_by: mockUsers[1],
    assigned_to: mockUsers[0],
    organization: mockOrganization,
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
    updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    resolved_at: null,
    closed_at: null,
    comments_count: 7,
    attachments_count: 2,
    ai_summary: {
      risk_score: 94,
      confidence: 91,
      predicted_severity: 'CRITICAL',
      summary:
        'AI detected a multi-vector volumetric SYN flood attacking ingress gateway port 443 combined with memory leak on auth middleware pods.',
      root_cause_hypothesis:
        'Unbounded connection pool buffer in auth-service container v2.4.1 causing OOMKilled cascade under high connection churn.',
      recommended_actions: [
        'Apply Cloudflare WAF Rate Limiting Rule #4092 to block subnet 194.28.0.0/16',
        'Roll back auth-service deployment to image tag v2.4.0-stable',
        'Increase pod memory limit from 512Mi to 2Gi on production namespaces',
      ],
      suggested_code_fix: `// auth_middleware.go - Fix unbounded context leaks
ctx, cancel := context.WithTimeout(r.Context(), 2500*time.Millisecond)
defer cancel()

connPool.SetMaxOpenConns(100)
connPool.SetMaxIdleConns(25)
connPool.SetConnMaxLifetime(5 * time.Minute)`,
      similar_incidents: [
        {
          id: 'inc-8842-99',
          title: 'EU-West Auth Ingress OOM Cascade',
          similarity_score: 96,
          resolved_in_mins: 18,
        },
        {
          id: 'inc-7621-12',
          title: 'US-East Rate Limit Buffer Overflow',
          similarity_score: 84,
          resolved_in_mins: 32,
        },
      ],
      rag_citations: [
        {
          document_id: 'doc-rag-01',
          document_title: 'Enterprise Incident Response Runbook 2026',
          page: 3,
          chunk: 2,
          similarity: 0.94,
          snippet:
            'In case of unauthorized network intrusion or SYN flood, immediately isolate the host VLAN and apply Cloudflare rate limiting rules.',
        },
        {
          document_id: 'doc-rag-02',
          document_title: 'DDoS Mitigation & Upstream Routing Policy',
          page: 2,
          chunk: 4,
          similarity: 0.89,
          snippet:
            'When volumetric SYN flood exceeds 4000 RPS, trigger upstream BGP anycast scrubbing and scale pod memory limits.',
        },
      ],
    },
  },
  {
    id: 'inc-9081-02',
    title: 'Anomalous Data Exfiltration Attempt via Compromised Service Account',
    description:
      'GuardDuty trigger: IAM Role arn:aws:iam::8842:role/DevOps-Pipeline invoked DescribeSecrets and ExportSnapshot across 14 RDS Postgres databases within 90 seconds.',
    severity: 'HIGH',
    status: 'IDENTIFIED',
    category: 'Security',
    created_by: mockUsers[0],
    assigned_to: mockUsers[1],
    organization: mockOrganization,
    created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // 75 mins ago
    updated_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    resolved_at: null,
    closed_at: null,
    comments_count: 12,
    attachments_count: 4,
    ai_summary: {
      risk_score: 88,
      confidence: 95,
      predicted_severity: 'HIGH',
      summary:
        'Leaked CI/CD pipeline token leveraged from external repository runner to query AWS Secrets Manager.',
      root_cause_hypothesis:
        'GitHub Actions runner log exposure disclosed short-lived AWS STS credentials with excessive wildcard permissions.',
      recommended_actions: [
        'Revoke STS session for DevOps-Pipeline IAM role immediately',
        'Rotate all 14 database credentials stored in Secrets Manager',
        'Enforce Least Privilege IAM Policy using AWS Access Analyzer',
      ],
      suggested_code_fix: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": ["rds:CreateDBSnapshot", "secretsmanager:GetSecretValue"],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": { "aws:PrincipalTag/Team": "SecurityOps" }
      }
    }
  ]
}`,
      similar_incidents: [
        {
          id: 'inc-6540-08',
          title: 'Leaked AWS Secret Key in Git Commit',
          similarity_score: 89,
          resolved_in_mins: 22,
        },
      ],
    },
  },
  {
    id: 'inc-9081-03',
    title: 'Primary Postgres DB Lock Contention & Transaction Deadlock',
    description:
      'Database connection pool exhausted (100% active connections). 42 queries blocked in Waiting state on table `incident_events` during batch update job.',
    severity: 'MEDIUM',
    status: 'MITIGATING',
    category: 'Database',
    created_by: mockUsers[2],
    assigned_to: mockUsers[2],
    organization: mockOrganization,
    created_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    resolved_at: null,
    closed_at: null,
    comments_count: 4,
    attachments_count: 1,
    ai_summary: {
      risk_score: 62,
      confidence: 88,
      predicted_severity: 'MEDIUM',
      summary:
        'Unindexed query on incident_events created_at column causing full table scans during analytics rollup.',
      root_cause_hypothesis:
        'Missing composite index on (organization_id, created_at) causing row lock accumulation.',
      recommended_actions: [
        'Terminate long-running PID 84920 via pg_cancel_backend()',
        'Execute concurrent index creation on incident_events table',
      ],
      suggested_code_fix: `CREATE INDEX CONCURRENTLY idx_events_org_created 
ON apps_incidents_event (organization_id, created_at DESC);`,
      similar_incidents: [],
    },
  },
  {
    id: 'inc-9081-04',
    title: 'Redis Cluster Node Failure & Cache Invalidation Cascade',
    description:
      'Redis replica shard 3 dropped connection due to hardware memory fault. Fallback DB load spike observed across read replicas.',
    severity: 'LOW',
    status: 'RESOLVED',
    category: 'Infrastructure',
    created_by: mockUsers[1],
    assigned_to: mockUsers[0],
    organization: mockOrganization,
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    closed_at: null,
    comments_count: 5,
    attachments_count: 0,
    ai_summary: {
      risk_score: 35,
      confidence: 97,
      predicted_severity: 'LOW',
      summary:
        'Transient hardware fault handled automatically by AWS Elasticache cluster failover.',
      root_cause_hypothesis: 'ECC RAM single-bit error triggered cluster node reboot.',
      recommended_actions: ['Monitor cache hit ratio for next 2 hours'],
      similar_incidents: [],
    },
  },
  {
    id: 'inc-9081-05',
    title: 'BGP Routing Flap Causing Intermittent Packet Drop in APAC',
    description:
      'Trans-Pacific submarine cable degradation caused 4.2% packet loss between Tokyo and Singapore data centers.',
    severity: 'HIGH',
    status: 'CLOSED',
    category: 'Network',
    created_by: mockUsers[0],
    assigned_to: mockUsers[1],
    organization: mockOrganization,
    created_at: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    closed_at: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    comments_count: 8,
    attachments_count: 3,
  },
];

export const mockSystemMetrics: SystemMetrics = {
  active_incidents: 3,
  critical_count: 1,
  high_count: 1,
  medium_count: 1,
  low_count: 0,
  mttr_minutes: 18.4,
  mttd_minutes: 2.1,
  sla_compliance_pct: 99.4,
  health_status: 'HEALTHY',
  severity_distribution: [
    { name: 'Critical', value: 1, fill: '#ef4444' },
    { name: 'High', value: 1, fill: '#f97316' },
    { name: 'Medium', value: 1, fill: '#f59e0b' },
    { name: 'Low', value: 2, fill: '#10b981' },
  ],
  incident_trends: [
    { timestamp: '00:00', critical: 0, high: 0, medium: 1, low: 0 },
    { timestamp: '04:00', critical: 0, high: 1, medium: 0, low: 1 },
    { timestamp: '08:00', critical: 1, high: 0, medium: 2, low: 1 },
    { timestamp: '12:00', critical: 1, high: 1, medium: 1, low: 0 },
    { timestamp: '16:00', critical: 0, high: 2, medium: 1, low: 2 },
    { timestamp: '20:00', critical: 1, high: 1, medium: 1, low: 0 },
  ],
  response_times: [
    { day: 'Mon', mttr: 24, mttd: 3.5 },
    { day: 'Tue', mttr: 19, mttd: 2.8 },
    { day: 'Wed', mttr: 22, mttd: 2.1 },
    { day: 'Thu', mttr: 16, mttd: 1.9 },
    { day: 'Fri', mttr: 18, mttd: 2.0 },
    { day: 'Sat', mttr: 14, mttd: 1.5 },
    { day: 'Sun', mttr: 15, mttd: 1.6 },
  ],
  mini_heatmap: [
    { day: 'Mon', hour: 10, value: 4 },
    { day: 'Mon', hour: 14, value: 8 },
    { day: 'Tue', hour: 11, value: 2 },
    { day: 'Wed', hour: 15, value: 9 },
    { day: 'Thu', hour: 9, value: 3 },
    { day: 'Fri', hour: 16, value: 7 },
  ],
};

export const mockActivityLogs: ActivityLogItem[] = [
  {
    id: 'log-901',
    user: mockUsers[0],
    action: 'Changed Incident Status to INVESTIGATING',
    target: 'inc-9081-01 (Kubernetes Cluster Auth API)',
    ip_address: '192.168.1.104',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    type: 'INCIDENT',
  },
  {
    id: 'log-902',
    user: mockUsers[1],
    action: 'Generated AI Root Cause Analysis',
    target: 'inc-9081-02 (Anomalous Data Exfiltration)',
    ip_address: '10.0.4.88',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    type: 'AI',
  },
  {
    id: 'log-903',
    user: mockUsers[0],
    action: 'User Authentication Successful (2FA)',
    target: 'alex.chen@acme-security.io',
    ip_address: '192.168.1.104',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    type: 'AUTH',
  },
  {
    id: 'log-904',
    user: mockUsers[2],
    action: 'Assigned Incident to Sarah Jenkins',
    target: 'inc-9081-02',
    ip_address: '172.16.0.12',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    type: 'INCIDENT',
  },
  {
    id: 'log-905',
    user: mockUsers[0],
    action: 'Updated Global WAF Policy #4092',
    target: 'Cloudflare Ingress Protection',
    ip_address: '192.168.1.104',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    type: 'SECURITY',
  },
];
