import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Server,
  Key,
  Terminal,
  ShieldCheck,
  Zap,
  Globe,
  RefreshCw,
  Search,
  AlertTriangle,
  Check,
  Plus,
  Trash2,
  Copy,
  Send,
  ChevronRight,
  Bell,
  Layers,
  BarChart3,
  Code2,
} from 'lucide-react';

// --- TYPES ---
type ServiceStatus = 'Healthy' | 'Degraded' | 'Down' | 'Maintenance';
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
type AuthType = 'Bearer JWT' | 'OAuth 2.0' | 'API Key';

interface MicroService {
  id: string;
  name: string;
  category: string;
  status: ServiceStatus;
  uptime: number;
  latency: number;
  rps: number;
  region: string;
  lastCheck: string;
  errorRate: number;
  version: string;
}

interface ApiEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  auth: AuthType;
  rateLimit: string;
  version: string;
  description: string;
  defaultPayload?: string;
  defaultHeaders?: string;
}

interface SystemLog {
  id: string;
  timestamp: string;
  service: string;
  level: LogLevel;
  message: string;
  code: number;
}

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  created: string;
  expires: string;
  usage: number;
  limit: number;
  scopes: string[];
  status: 'Active' | 'Revoked' | 'Expired';
}

interface Incident {
  id: string;
  title: string;
  service: string;
  severity: 'High' | 'Medium' | 'Critical';
  status: 'Open' | 'Investigating' | 'Resolved';
  time: string;
  assignedTo?: string;
}

type TabId = 'dashboard' | 'services' | 'api-catalog' | 'logs' | 'security';

// --- INITIAL MOCK DATA ---
const INITIAL_SERVICES: MicroService[] = [
  { id: 'srv-auth', name: 'Auth & Identity Gateway', category: 'Security', status: 'Healthy', uptime: 99.98, latency: 18, rps: 1420, region: 'EU-Central (Frankfurt)', lastCheck: 'Proprio ora', errorRate: 0.02, version: 'v2.4.1' },
  { id: 'srv-pay', name: 'Payment Gateway Broker', category: 'Finance', status: 'Healthy', uptime: 99.95, latency: 42, rps: 890, region: 'EU-West (Ireland)', lastCheck: '1 sec fa', errorRate: 0.05, version: 'v3.1.0' },
  { id: 'srv-cdn', name: 'Global CDN Edge Node', category: 'Infrastructure', status: 'Healthy', uptime: 99.99, latency: 8, rps: 5200, region: 'US-East (N. Virginia)', lastCheck: 'Proprio ora', errorRate: 0.001, version: 'v1.12.0' },
  { id: 'srv-sync', name: 'Real-time Data Sync Engine', category: 'Database', status: 'Degraded', uptime: 98.4, latency: 145, rps: 640, region: 'EU-Central (Frankfurt)', lastCheck: '3 sec fa', errorRate: 2.14, version: 'v1.8.5' },
  { id: 'srv-ai', name: 'AI LLM Inference Microservice', category: 'Machine Learning', status: 'Healthy', uptime: 99.5, latency: 230, rps: 180, region: 'US-West (Oregon)', lastCheck: '2 sec fa', errorRate: 0.85, version: 'v0.9.4' },
  { id: 'srv-analytics', name: 'Telemetry & Analytics Pipeline', category: 'Analytics', status: 'Healthy', uptime: 99.9, latency: 35, rps: 2800, region: 'AP-South (Mumbai)', lastCheck: 'Proprio ora', errorRate: 0.12, version: 'v2.0.2' },
];

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'api-1',
    name: 'Verifica Autenticazione Utente',
    method: 'POST',
    path: '/api/v2/auth/verify',
    auth: 'Bearer JWT',
    rateLimit: '1000 req/min',
    version: 'v2.0',
    description: 'Valida il token JWT passato negli header ed estrae il contesto utente.',
    defaultHeaders: '{\n  "Authorization": "Bearer eyJhbGciOiJIUzI1Ni...",\n  "Content-Type": "application/json"\n}',
    defaultPayload: '{\n  "tenant_id": "org_98741",\n  "include_permissions": true\n}',
  },
  {
    id: 'api-2',
    name: 'Esecuzione Transazione Pagamento',
    method: 'POST',
    path: '/api/v3/payments/charge',
    auth: 'OAuth 2.0',
    rateLimit: '200 req/min',
    version: 'v3.1',
    description: 'Elabora una transazione finanziaria sicura con tokenizzazione PCI-DSS.',
    defaultHeaders: '{\n  "Authorization": "Bearer oauth2_sec_token_9983",\n  "X-Idempotency-Key": "7b9d-4c32-a12b"\n}',
    defaultPayload: '{\n  "amount": 149.99,\n  "currency": "EUR",\n  "customer_id": "cust_4412",\n  "payment_method": "pm_card_visa_4242"\n}',
  },
  {
    id: 'api-3',
    name: 'Ottieni Metriche Server in Tempo Reale',
    method: 'GET',
    path: '/api/v1/telemetry/nodes',
    auth: 'API Key',
    rateLimit: '5000 req/min',
    version: 'v1.0',
    description: 'Restituisce i dati di stato e carico CPU/Memoria dei nodi cluster distribuiti.',
    defaultHeaders: '{\n  "X-API-Key": "deh_live_9983746192837465"\n}',
  },
  {
    id: 'api-4',
    name: 'Invocazione Generazione AI Prompt',
    method: 'POST',
    path: '/api/v1/ai/generate',
    auth: 'Bearer JWT',
    rateLimit: '60 req/min',
    version: 'v1.4',
    description: 'Invia una richiesta di sintesi o analisi guidata al modello LLM interno.',
    defaultHeaders: '{\n  "Authorization": "Bearer eyJhbGciOi...",\n  "Content-Type": "application/json"\n}',
    defaultPayload: '{\n  "prompt": "Analizza il log di sistema e suggerisci ottimizzazioni di banda.",\n  "max_tokens": 250,\n  "temperature": 0.3\n}',
  },
  {
    id: 'api-5',
    name: 'Purga Cache Edge CDN',
    method: 'DELETE',
    path: '/api/v1/cdn/cache',
    auth: 'API Key',
    rateLimit: '50 req/min',
    version: 'v1.2',
    description: 'Invalida le risorse in cache nei Point of Presence (PoP) globali.',
    defaultHeaders: '{\n  "X-API-Key": "deh_live_9983746192837465"\n}',
    defaultPayload: '{\n  "tags": ["static-assets", "v2-release"],\n  "purge_everything": false\n}',
  },
];

const INITIAL_LOGS: SystemLog[] = [
  { id: 'log-101', timestamp: '14:32:01.023', service: 'Auth & Identity Gateway', level: 'INFO', message: 'Token JWT validato con successo per tenant enterprise_42', code: 200 },
  { id: 'log-102', timestamp: '14:32:02.145', service: 'Real-time Data Sync Engine', level: 'WARN', message: 'Latenza elevata nel nodo Redis replica-eu-2 (148ms > thresh 100ms)', code: 299 },
  { id: 'log-103', timestamp: '14:32:03.580', service: 'Payment Gateway Broker', level: 'INFO', message: 'Transazione #tx_883921 completata tramite gateway Stripe EU', code: 201 },
  { id: 'log-104', timestamp: '14:32:04.891', service: 'AI LLM Inference Microservice', level: 'ERROR', message: 'Timeout nella richiesta al cluster GPU node-us-west-4', code: 504 },
  { id: 'log-105', timestamp: '14:32:05.112', service: 'Global CDN Edge Node', level: 'INFO', message: 'Purga cache completata per 120 PoP regionali', code: 200 },
  { id: 'log-106', timestamp: '14:32:06.402', service: 'Auth & Identity Gateway', level: 'WARN', message: 'Tentativi multipli di login falliti da IP 185.220.101.4', code: 401 },
];

const INITIAL_KEYS: ApiKeyItem[] = [
  { id: 'key-1', name: 'Prod Dashboard Master Key', keyPrefix: 'deh_live_9983...', created: '2024-01-15', expires: '2025-01-15', usage: 148200, limit: 500000, scopes: ['read:all', 'write:all', 'admin'], status: 'Active' },
  { id: 'key-2', name: 'Mobile App Gateway Token', keyPrefix: 'deh_live_4412...', created: '2024-03-01', expires: '2024-12-31', usage: 894000, limit: 1000000, scopes: ['read:services', 'execute:api'], status: 'Active' },
  { id: 'key-3', name: 'Staging Environment Tester', keyPrefix: 'deh_test_0012...', created: '2024-04-10', expires: '2024-10-10', usage: 12400, limit: 50000, scopes: ['read:services'], status: 'Revoked' },
];

const INITIAL_INCIDENTS: Incident[] = [
  { id: 'INC-2024-09', title: 'Degradamento latenza Data Sync Engine', service: 'Real-time Data Sync Engine', severity: 'Medium', status: 'Investigating', time: '12 min fa', assignedTo: 'Marco Rossi (DevOps Lead)' },
  { id: 'INC-2024-08', title: 'Flusso di errore HTTP 504 su cluster AI', service: 'AI LLM Inference Microservice', severity: 'High', status: 'Open', time: '35 min fa' },
];

const STATUS_BADGE: Record<ServiceStatus, string> = {
  Healthy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Degraded: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Maintenance: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Down: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const STATUS_DOT: Record<ServiceStatus, string> = {
  Healthy: 'bg-emerald-400 animate-pulse',
  Degraded: 'bg-amber-400',
  Maintenance: 'bg-blue-400',
  Down: 'bg-rose-400',
};

const METHOD_BADGE: Record<ApiEndpoint['method'], string> = {
  GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DELETE: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

const LOG_BADGE: Record<LogLevel, string> = {
  INFO: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  WARN: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ERROR: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  CRITICAL: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [services, setServices] = useState<MicroService[]>(INITIAL_SERVICES);
  const [logs, setLogs] = useState<SystemLog[]>(INITIAL_LOGS);
  const [keys, setKeys] = useState<ApiKeyItem[]>(INITIAL_KEYS);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);

  const [latencyHistory, setLatencyHistory] = useState<number[]>([
    24, 28, 22, 35, 30, 26, 42, 38, 29, 31, 27, 33, 25, 29, 32,
  ]);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const [selectedApi, setSelectedApi] = useState<ApiEndpoint>(API_ENDPOINTS[0]);
  const [playgroundHeaders, setPlaygroundHeaders] = useState<string>(API_ENDPOINTS[0].defaultHeaders || '');
  const [playgroundBody, setPlaygroundBody] = useState<string>(API_ENDPOINTS[0].defaultPayload || '');
  const [playgroundResponse, setPlaygroundResponse] = useState<{ status: number; text: string; time: number } | null>(null);
  const [isSendingReq, setIsSendingReq] = useState<boolean>(false);

  const [logFilterSeverity, setLogFilterSeverity] = useState<string>('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  const [showNewKeyModal, setShowNewKeyModal] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [showIncidentModal, setShowIncidentModal] = useState<boolean>(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectApi = (api: ApiEndpoint) => {
    setSelectedApi(api);
    setPlaygroundHeaders(api.defaultHeaders || '');
    setPlaygroundBody(api.defaultPayload || '');
    setPlaygroundResponse(null);
  };

  // Simulate real-time metrics update
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setServices((prev) =>
        prev.map((srv) => {
          if (srv.status === 'Maintenance') return srv;
          const deltaLatency = Math.floor(Math.random() * 9) - 4;
          const newLatency = Math.max(5, srv.latency + deltaLatency);
          const deltaRps = Math.floor(Math.random() * 40) - 20;
          const newRps = Math.max(10, srv.rps + deltaRps);
          return { ...srv, latency: newLatency, rps: newRps, lastCheck: 'Proprio ora' };
        }),
      );

      setLatencyHistory((prev) => {
        const nextVal = Math.floor(Math.random() * 15) + 22;
        return [...prev.slice(1), nextVal];
      });

      if (Math.random() > 0.6) {
        const randomSrv = services[Math.floor(Math.random() * services.length)];
        const levels: LogLevel[] = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];
        const lvl = levels[Math.floor(Math.random() * levels.length)];
        const now = new Date();
        const ts =
          now.toTimeString().split(' ')[0] + '.' + Math.floor(Math.random() * 900 + 100);

        let msg = `Operazione routine completata su node #${Math.floor(Math.random() * 8 + 1)}`;
        let code = 200;
        if (lvl === 'WARN') {
          msg = `Picco di memoria rilevato (>82%) nella cache locale`;
          code = 299;
        } else if (lvl === 'ERROR') {
          msg = `Timeout connessione upstream verso database secondario`;
          code = 503;
        }

        const newLog: SystemLog = {
          id: `log-${Date.now()}`,
          timestamp: ts,
          service: randomSrv.name,
          level: lvl,
          message: msg,
          code,
        };

        setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, services]);

  const handleExecuteApiCall = () => {
    setIsSendingReq(true);
    setPlaygroundResponse(null);

    setTimeout(() => {
      setIsSendingReq(false);
      const isSuccess = Math.random() > 0.15;
      const status = isSuccess ? (selectedApi.method === 'POST' ? 201 : 200) : 500;
      const latency = Math.floor(Math.random() * 60) + 15;

      const resObj: Record<string, unknown> = {
        success: isSuccess,
        timestamp: new Date().toISOString(),
        endpoint: selectedApi.path,
        method: selectedApi.method,
        execution_time_ms: latency,
        headers_received: {
          'content-type': 'application/json',
          'x-rate-limit-remaining': '984',
          'x-cluster-node': 'eu-central-1a-prod-3',
        },
      };

      if (isSuccess) {
        if (selectedApi.id === 'api-1') {
          resObj.data = { authenticated: true, user_id: 'usr_8839201', role: 'System Admin', tenant: 'Enterprise Hub Inc' };
        } else if (selectedApi.id === 'api-2') {
          resObj.data = { transaction_id: 'tx_9983172', amount: 149.99, currency: 'EUR', status: 'CAPTURED', pci_compliance: 'PASSED' };
        } else if (selectedApi.id === 'api-3') {
          resObj.data = { total_nodes: 24, active_instances: 24, avg_cpu_usage: '34.2%', total_rps: 12450 };
        } else {
          resObj.data = { response: 'Operazione processata con successo dai nodi distribuiti.', status: 'OK' };
        }
      } else {
        resObj.error = {
          code: 'INTERNAL_SERVICE_ERR',
          message: 'Impossibile completare la richiesta a causa di un timeout di rete simulato.',
        };
      }

      setPlaygroundResponse({
        status,
        text: JSON.stringify(resObj, null, 2),
        time: latency,
      });

      triggerToast(`Richiesta inviata a ${selectedApi.path} (${status} - ${latency}ms)`);
    }, 600);
  };

  const toggleServiceStatus = (serviceId: string) => {
    setServices((prev) =>
      prev.map((srv) => {
        if (srv.id === serviceId) {
          const nextStatus: ServiceStatus = srv.status === 'Healthy' ? 'Maintenance' : 'Healthy';
          triggerToast(`Stato di "${srv.name}" aggiornato a ${nextStatus}`);
          return { ...srv, status: nextStatus };
        }
        return srv;
      }),
    );
  };

  const handleCreateApiKey = () => {
    if (!newKeyName.trim()) return;
    const newKey: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      keyPrefix: `deh_live_${Math.floor(1000 + Math.random() * 9000)}...`,
      created: new Date().toISOString().split('T')[0],
      expires: '2025-12-31',
      usage: 0,
      limit: 250000,
      scopes: ['read:services', 'execute:api'],
      status: 'Active',
    };
    setKeys([newKey, ...keys]);
    setNewKeyName('');
    setShowNewKeyModal(false);
    triggerToast(`Nuova chiave API "${newKey.name}" generata con successo!`);
  };

  const revokeApiKey = (id: string) => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: 'Revoked' } : k)));
    triggerToast('Chiave API revocata con successo.');
  };

  const resolveIncident = (incId: string) => {
    setIncidents((prev) => prev.map((i) => (i.id === incId ? { ...i, status: 'Resolved' } : i)));
    setShowIncidentModal(false);
    triggerToast(`Incidente ${incId} contrassegnato come Risolto.`);
  };

  const totalRps = useMemo(() => services.reduce((acc, curr) => acc + curr.rps, 0), [services]);
  const avgUptime = useMemo(
    () => (services.reduce((acc, curr) => acc + curr.uptime, 0) / services.length).toFixed(2),
    [services],
  );
  const avgLatency = useMemo(
    () => Math.round(services.reduce((acc, curr) => acc + curr.latency, 0) / services.length),
    [services],
  );
  const activeKeysCount = useMemo(() => keys.filter((k) => k.status === 'Active').length, [keys]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSeverity = logFilterSeverity === 'ALL' || log.level === logFilterSeverity;
      const q = logSearchQuery.toLowerCase();
      const matchQuery = log.message.toLowerCase().includes(q) || log.service.toLowerCase().includes(q);
      return matchSeverity && matchQuery;
    });
  }, [logs, logFilterSeverity, logSearchQuery]);

  const openIncidents = incidents.filter((i) => i.status !== 'Resolved');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[60] flex items-center gap-3 bg-slate-900 border border-cyan-500/40 text-cyan-300 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-slideIn">
          <Zap className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-lg flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Digital Ecosystem Hub
            </h1>
            <p className="text-xs text-slate-400 font-mono hidden sm:block">
              Piattaforma Monitoraggio Infrastrutture & API Distribuiti
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{autoRefresh ? 'Live Streaming Attivo' : 'Aggiornamento Pausato'}</span>
            <span className="sm:hidden">{autoRefresh ? 'Live' : 'Pausa'}</span>
          </button>

          <button
            onClick={() => {
              if (openIncidents.length > 0) {
                setSelectedIncident(openIncidents[0]);
                setShowIncidentModal(true);
              }
            }}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Notifiche Incidenti"
          >
            <Bell className="w-4 h-4" />
            {openIncidents.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-xs font-bold text-blue-300">
              DE
            </div>
            <div className="hidden md:block text-left text-xs">
              <div className="font-semibold text-slate-200">DevOps Engineer</div>
              <div className="text-slate-400">admin@ecosystem.io</div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex-col justify-between hidden md:flex shrink-0">
          <div className="p-4 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">
              Monitoraggio & Controllo
            </div>

            <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Activity className="w-4 h-4" />}>
              Dashboard Esecutiva
            </NavButton>
            <NavButton active={activeTab === 'services'} onClick={() => setActiveTab('services')} icon={<Server className="w-4 h-4" />}>
              <span className="flex-1 text-left">Stato Microservizi</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">{services.length}</span>
            </NavButton>

            <div className="pt-4 px-3 py-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">
              Integrazione & APIs
            </div>

            <NavButton active={activeTab === 'api-catalog'} onClick={() => setActiveTab('api-catalog')} icon={<Code2 className="w-4 h-4" />}>
              Catalogo & Sandbox API
            </NavButton>
            <NavButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Key className="w-4 h-4" />}>
              Sicurezza & Chiavi API
            </NavButton>

            <div className="pt-4 px-3 py-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">
              Analisi Log & Diagnostica
            </div>

            <NavButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<Terminal className="w-4 h-4" />}>
              Stream Log Telemetria
            </NavButton>
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950/40">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Cluster Regionale</span>
                <span className="font-mono text-emerald-400">ONLINE</span>
              </div>
              <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                eu-central-1 (Frankfurt)
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden flex border-t border-slate-800 bg-slate-900 overflow-x-auto p-2 gap-2 fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md">
          <MobileTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Activity className="w-3.5 h-3.5" />} label="Dashboard" />
          <MobileTab active={activeTab === 'services'} onClick={() => setActiveTab('services')} icon={<Server className="w-3.5 h-3.5" />} label="Servizi" />
          <MobileTab active={activeTab === 'api-catalog'} onClick={() => setActiveTab('api-catalog')} icon={<Code2 className="w-3.5 h-3.5" />} label="API" />
          <MobileTab active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Key className="w-3.5 h-3.5" />} label="Sicurezza" />
          <MobileTab active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<Terminal className="w-3.5 h-3.5" />} label="Logs" />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-24 md:pb-8">
          {openIncidents.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-200 text-sm">
                    Attenzione: {openIncidents.length} incidente attivo rilevato
                  </h4>
                  <p className="text-xs text-slate-400">{openIncidents[0]?.title}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedIncident(openIncidents[0] || null);
                  setShowIncidentModal(true);
                }}
                className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold border border-amber-500/30 transition whitespace-nowrap"
              >
                Gestisci Incidente
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Uptime Globale" value={`${avgUptime}%`} hint="SLA OK" icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />} valueColor="text-slate-100">
                  <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-400 h-1.5 rounded-full transition-all" style={{ width: `${avgUptime}%` }} />
                  </div>
                </StatCard>

                <StatCard label="Latenza Media Network" value={`${avgLatency} ms`} hint="Fast Response" icon={<Zap className="w-5 h-5 text-cyan-400" />}>
                  <p className="mt-2 text-[11px] text-slate-500">Target aziendale &lt; 50ms</p>
                </StatCard>

                <StatCard label="Throughput API (RPS)" value={totalRps.toLocaleString()} hint="req/sec" icon={<BarChart3 className="w-5 h-5 text-blue-400" />}>
                  <p className="mt-2 text-[11px] text-slate-500">Distribuzione su 6 nodi distribuiti</p>
                </StatCard>

                <StatCard label="Chiavi API Attive" value={`${activeKeysCount} / ${keys.length}`} hint="Attive" icon={<Key className="w-5 h-5 text-amber-400" />}>
                  <p className="mt-2 text-[11px] text-slate-500">Tutti i client autenticati</p>
                </StatCard>
              </div>

              {/* Latency chart + regional traffic */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-200 text-base">Andamento Latenza di Sistema</h3>
                        <p className="text-xs text-slate-400">Aggiornamento in tempo reale ogni 3 secondi</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-xs border border-cyan-500/20">
                        {latencyHistory[latencyHistory.length - 1]} ms
                      </span>
                    </div>

                    <div className="h-48 w-full mt-4 flex items-end gap-1.5 pt-6 pb-2 px-2 bg-slate-950/50 rounded-xl border border-slate-800/80 relative">
                      <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
                        <div className="border-b border-slate-600 w-full" />
                        <div className="border-b border-slate-600 w-full" />
                        <div className="border-b border-slate-600 w-full" />
                      </div>

                      {latencyHistory.map((val, idx) => {
                        const heightPct = Math.min(100, Math.max(15, (val / 60) * 100));
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div className="absolute -top-8 bg-slate-800 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition shadow pointer-events-none z-10">
                              {val}ms
                            </div>
                            <div
                              className="w-full bg-gradient-to-t from-blue-600/40 via-cyan-500 to-blue-500 rounded-t-sm transition-all duration-500 group-hover:brightness-125"
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>T - 45s</span>
                    <span>T - 30s</span>
                    <span>T - 15s</span>
                    <span>Ora</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-200 text-base mb-1">Traffico Regionale Node</h3>
                    <p className="text-xs text-slate-400 mb-4">Ripartizione del carico server globale</p>

                    <div className="space-y-4">
                      <RegionBar label="EU-Central (Frankfurt)" value="45% (3.4k RPS)" pct={45} color="bg-cyan-500" text="text-cyan-400" />
                      <RegionBar label="US-East (N. Virginia)" value="35% (2.6k RPS)" pct={35} color="bg-blue-500" text="text-blue-400" />
                      <RegionBar label="AP-South (Mumbai)" value="20% (1.5k RPS)" pct={20} color="bg-amber-500" text="text-amber-400" />
                    </div>
                  </div>

                  <div className="mt-6 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Protocollo Attivo:</span>
                    <span className="font-mono text-slate-200 bg-slate-800 px-2 py-0.5 rounded">HTTP/3 (QUIC) + gRPC</span>
                  </div>
                </div>
              </div>

              {/* Services quick grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-200 text-lg">Stato Sintetico Microservizi</h3>
                  <button
                    onClick={() => setActiveTab('services')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    Vedi tutti i dettagli <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-slate-200 text-sm">{service.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{service.category} • {service.version}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono border ${STATUS_BADGE[service.status]}`}>
                          {service.status}
                        </span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                        <div>Latenza: <span className="text-slate-200 font-bold">{service.latency}ms</span></div>
                        <div>Carico: <span className="text-slate-200 font-bold">{service.rps} rps</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Infrastruttura Microservizi Distribuiti</h2>
                  <p className="text-xs text-slate-400">Gestione, manutenzione e verifica in tempo reale dei nodi</p>
                </div>
                <button
                  onClick={() => {
                    setServices((prev) =>
                      prev.map((s) => ({ ...s, latency: Math.floor(Math.random() * 20) + 10, lastCheck: 'Proprio ora' })),
                    );
                    triggerToast('Ping manuale completato su tutti i nodi infrastrutturali.');
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-lg shadow-cyan-600/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Esegui Ping Salute Globale
                </button>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 uppercase font-mono text-[11px] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-4">Servizio & Categoria</th>
                        <th className="p-4">Stato Nodo</th>
                        <th className="p-4">Regione AWS/Cloud</th>
                        <th className="p-4">Latenza Ping</th>
                        <th className="p-4">SLA Uptime</th>
                        <th className="p-4">Tasso Errore</th>
                        <th className="p-4 text-right">Azione Manutenzione</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {services.map((srv) => (
                        <tr key={srv.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4">
                            <div className="font-bold text-slate-200 text-sm">{srv.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{srv.category} • {srv.version}</div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border ${STATUS_BADGE[srv.status]}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[srv.status]}`} />
                              {srv.status}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-300">{srv.region}</td>
                          <td className="p-4 font-mono">
                            <span className={srv.latency > 100 ? 'text-amber-400 font-bold' : 'text-slate-200'}>{srv.latency} ms</span>
                          </td>
                          <td className="p-4 font-mono text-emerald-400 font-semibold">{srv.uptime}%</td>
                          <td className="p-4 font-mono">
                            <span className={srv.errorRate > 1 ? 'text-rose-400 font-bold' : 'text-slate-400'}>{srv.errorRate}%</span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => toggleServiceStatus(srv.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                                srv.status === 'Maintenance'
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              {srv.status === 'Maintenance' ? 'Ripristina Nodo' : 'Metti in Manutenzione'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api-catalog' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Catalogo Endpoints & API Sandbox</h2>
                <p className="text-xs text-slate-400">Testa interattivamente le chiamate RESTful simulate dei servizi registrati</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-3">
                  <div className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                    Endpoints Disponibili ({API_ENDPOINTS.length})
                  </div>

                  {API_ENDPOINTS.map((api) => (
                    <div
                      key={api.id}
                      onClick={() => handleSelectApi(api)}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        selectedApi.id === api.id
                          ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/5'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono border ${METHOD_BADGE[api.method]}`}>
                            {api.method}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-200">{api.path}</span>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">{api.version}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-300">{api.name}</div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>Auth: {api.auth}</span>
                        <span>{api.rateLimit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${METHOD_BADGE[selectedApi.method]}`}>
                            {selectedApi.method}
                          </span>
                          <h3 className="font-bold text-slate-100 text-base font-mono">{selectedApi.path}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{selectedApi.description}</p>
                      </div>

                      <button
                        onClick={handleExecuteApiCall}
                        disabled={isSendingReq}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                      >
                        {isSendingReq ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> In corso...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" /> Invia Richiesta
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-3 mb-4">
                      <label className="text-xs font-mono text-slate-400 font-bold block">HTTP Headers (JSON)</label>
                      <textarea
                        value={playgroundHeaders}
                        onChange={(e) => setPlaygroundHeaders(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition resize-y"
                      />
                    </div>

                    {selectedApi.method !== 'GET' && selectedApi.method !== 'DELETE' && (
                      <div className="space-y-3 mb-4">
                        <label className="text-xs font-mono text-slate-400 font-bold block">Request Body (JSON Payload)</label>
                        <textarea
                          value={playgroundBody}
                          onChange={(e) => setPlaygroundBody(e.target.value)}
                          rows={4}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 transition resize-y"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-400 font-bold">Risposta Simulata Server</span>
                        {playgroundResponse && (
                          <div className="flex items-center gap-3 text-xs font-mono">
                            <span className={playgroundResponse.status < 300 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              Status: {playgroundResponse.status}
                            </span>
                            <span className="text-slate-400">Tempo: {playgroundResponse.time}ms</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[160px] max-h-[220px] overflow-y-auto font-mono text-xs">
                        {playgroundResponse ? (
                          <pre className="text-emerald-400 leading-relaxed whitespace-pre-wrap">{playgroundResponse.text}</pre>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-600 italic">
                            Clicca su "Invia Richiesta" per simulare l'esecuzione API
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Gestione Chiavi API & Autorizzazioni</h2>
                  <p className="text-xs text-slate-400">Gestisci i token di accesso per l'integrazione di servizi esterni</p>
                </div>
                <button
                  onClick={() => setShowNewKeyModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-lg shadow-cyan-600/20"
                >
                  <Plus className="w-4 h-4" /> Genera Nuova Chiave API
                </button>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 uppercase font-mono text-[11px] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-4">Nome Token</th>
                        <th className="p-4">Prefisso Chiave</th>
                        <th className="p-4">Permessi (Scopes)</th>
                        <th className="p-4">Utilizzo Quota Mensile</th>
                        <th className="p-4">Stato</th>
                        <th className="p-4 text-right">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {keys.map((keyItem) => {
                        const usagePct = Math.min(100, Math.round((keyItem.usage / keyItem.limit) * 100));
                        return (
                          <tr key={keyItem.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-4">
                              <div className="font-bold text-slate-200">{keyItem.name}</div>
                              <div className="text-[11px] text-slate-500">Creato il: {keyItem.created}</div>
                            </td>
                            <td className="p-4 font-mono text-cyan-400">
                              <div className="flex items-center gap-2">
                                <span>{keyItem.keyPrefix}</span>
                                <button
                                  onClick={() => triggerToast('Prefisso chiave copiato negli appunti.')}
                                  className="text-slate-500 hover:text-slate-300"
                                  title="Copia"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {keyItem.scopes.map((sc, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                                    {sc}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1 w-36">
                                <div className="flex justify-between text-[11px] font-mono">
                                  <span className="text-slate-400">{keyItem.usage.toLocaleString()}</span>
                                  <span className="text-slate-500">/ {keyItem.limit.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${usagePct > 80 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                                    style={{ width: `${usagePct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border ${
                                  keyItem.status === 'Active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}
                              >
                                {keyItem.status === 'Active' ? 'Attivo' : 'Revocato'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {keyItem.status === 'Active' && (
                                <button
                                  onClick={() => revokeApiKey(keyItem.id)}
                                  className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition"
                                  title="Revoca Chiave"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Stream Log Diagnostici & Eventi</h2>
                  <p className="text-xs text-slate-400">Monitoraggio live del flusso messaggi generato dai microservizi</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cerca log o servizio..."
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-48"
                    />
                  </div>

                  <select
                    value={logFilterSeverity}
                    onChange={(e) => setLogFilterSeverity(e.target.value)}
                    className="py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="ALL">Tutti i Livelli</option>
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="ERROR">ERROR</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl font-mono text-xs">
                <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>/var/log/ecosystem-hub/live-stream.log</span>
                  </div>
                  <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                    Showing {filteredLogs.length} events
                  </span>
                </div>

                <div className="p-4 space-y-2.5 max-h-[500px] overflow-y-auto">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 hover:bg-slate-900/50 p-1.5 rounded transition">
                      <span className="text-slate-500 text-[11px] shrink-0">{log.timestamp}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border ${LOG_BADGE[log.level]}`}>
                        {log.level}
                      </span>
                      <span className="text-slate-400 shrink-0 font-semibold">[{log.service}]</span>
                      <span className="text-slate-200 flex-1">{log.message}</span>
                      <span className="text-slate-600 text-[11px]">code={log.code}</span>
                    </div>
                  ))}

                  {filteredLogs.length === 0 && (
                    <div className="text-center py-8 text-slate-600 italic">
                      Nessun log corrisponde ai criteri di ricerca impostati.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* New API key modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-lg font-bold text-slate-100">Genera Nuova Chiave API</h3>
            <p className="text-xs text-slate-400">Inserisci un identificativo descrittivo per la nuova chiave di produzione.</p>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300">Nome Client / Integrazione</label>
              <input
                type="text"
                placeholder="es. Mobile Android Client"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateApiKey()}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowNewKeyModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateApiKey}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs text-white font-semibold"
              >
                Conferma & Genera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident modal */}
      {showIncidentModal && selectedIncident && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                  {selectedIncident.id} • Severity {selectedIncident.severity}
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-1">{selectedIncident.title}</h3>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Servizio Impattato:</span>
                <span className="text-slate-200 font-mono">{selectedIncident.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tempo Rilevamento:</span>
                <span className="text-slate-200 font-mono">{selectedIncident.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assegnato A:</span>
                <span className="text-cyan-400 font-semibold">{selectedIncident.assignedTo || 'Non assegnato'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowIncidentModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
              >
                Chiudi
              </button>
              <button
                onClick={() => resolveIncident(selectedIncident.id)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-semibold flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Segna come Risolto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Small presentational helpers ---

function NavButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
        active
          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold shadow-sm'
          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function MobileTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
        active ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  valueColor = 'text-slate-100',
  children,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  valueColor?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        {icon}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-3xl font-extrabold font-mono ${valueColor}`}>{value}</span>
        <span className="text-xs font-semibold text-slate-400">{hint}</span>
      </div>
      {children}
    </div>
  );
}

function RegionBar({
  label,
  value,
  pct,
  color,
  text,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
  text: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 font-medium">
        <span className="text-slate-300">{label}</span>
        <span className={`font-mono ${text}`}>{value}</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
