import { useState } from 'react'
import {
  Puzzle,
  Mail,
  Cloud,
  Key,
  Database,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  RotateCw,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useIntegrations, useTestIntegration } from '@/lib/hooks/useAdmin'
import { cn } from '@/lib/utils/cn'
import type { IntegrationType, IntegrationStatus, Integration } from '@/types'

const typeConfig: Record<IntegrationType, { label: string; icon: typeof Mail; description: string; color: string }> = {
  EMAIL: { label: 'Email Service', icon: Mail, description: 'SMTP configuration for sending emails', color: 'bg-sky-100 text-sky-700 border border-sky-200' },
  STORAGE: { label: 'Cloud Storage', icon: Cloud, description: 'File storage for documents and uploads', color: 'bg-violet-100 text-violet-700 border border-violet-200' },
  AI: { label: 'AI Service', icon: Globe, description: 'AI-powered analysis and recommendations', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
  CALENDAR: { label: 'Calendar', icon: Database, description: 'Calendar integration for scheduling', color: 'bg-amber-100 text-amber-700 border border-amber-200' },
  SSO: { label: 'Single Sign-On', icon: Key, description: 'Authentication provider integration', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
}

const statusConfig: Record<IntegrationStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof CheckCircle }> = {
  ACTIVE: { label: 'Active', color: 'text-emerald-700', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-200', icon: CheckCircle },
  INACTIVE: { label: 'Inactive', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-stone-200', icon: XCircle },
  ERROR: { label: 'Error', color: 'text-rose-700', bgColor: 'bg-rose-100', borderColor: 'border-rose-200', icon: AlertTriangle },
  CONFIGURING: { label: 'Configuring', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-200', icon: RefreshCw },
}

export function IntegrationSettings() {
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const { data, isLoading, refetch } = useIntegrations()
  const testMutation = useTestIntegration()

  const handleTestConnection = async (integrationId: string) => {
    try {
      await testMutation.mutateAsync(integrationId)
    } catch (error) {
      console.error('Connection test failed:', error)
    }
  }

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const maskSecret = (value: string) => {
    if (value.length <= 8) return '••••••••'
    return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const integrationsByType = data?.integrations.reduce((acc, integration) => {
    if (!acc[integration.type]) {
      acc[integration.type] = []
    }
    acc[integration.type].push(integration)
    return acc
  }, {} as Record<IntegrationType, Integration[]>) || {}

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact hero with inline stat chips */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <Puzzle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Integration Settings</h1>
              <p className="text-stone-300 text-xs">Configure external services and API connections</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="border-stone-600 text-white hover:bg-stone-700">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Stat chips */}
        <div className="relative mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {[
            { label: 'Total', value: data?.integrations.length || 0, color: 'text-stone-200' },
            { label: 'Active', value: data?.integrations.filter((i) => i.status === 'ACTIVE').length || 0, color: 'text-emerald-300' },
            { label: 'Errors', value: data?.integrations.filter((i) => i.status === 'ERROR').length || 0, color: 'text-rose-300' },
            { label: 'Configuring', value: data?.integrations.filter((i) => i.status === 'CONFIGURING').length || 0, color: 'text-amber-300' },
          ].map((chip) => (
            <div key={chip.label} className="bg-stone-700/40 ring-1 ring-stone-600/40 rounded-md px-2 py-1.5">
              <div className={cn('text-base font-bold leading-none', chip.color)}>{chip.value}</div>
              <p className="text-[10px] text-stone-300 truncate uppercase tracking-wide">{chip.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Integrations by Type */}
      <div className="space-y-2.5">
        {Object.entries(typeConfig).map(([type, config]) => {
          const integrations = integrationsByType[type as IntegrationType] || []
          const Icon = config.icon

          return (
            <Card key={type} padding="sm" className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn('p-1.5 rounded-md', config.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">{config.label}</h3>
                    <p className="text-[11px] text-stone-500">{config.description}</p>
                  </div>
                </div>
              </div>

              {integrations.length > 0 ? (
                <div className="space-y-1.5">
                  {integrations.map((integration) => {
                    const status = statusConfig[integration.status]
                    const StatusIcon = status.icon

                    return (
                      <div
                        key={integration.integrationId}
                        className="p-2 border border-stone-200 rounded-md hover:border-stone-300 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-medium text-stone-900">{integration.name}</h4>
                            <span className={cn(
                              'px-1.5 py-0 rounded text-[10px] font-medium flex items-center gap-0.5 border',
                              status.bgColor,
                              status.color,
                              status.borderColor
                            )}>
                              <StatusIcon className="h-2.5 w-2.5" />
                              {status.label}
                            </span>
                            {integration.isEnabled ? (
                              <span className="px-1.5 py-0 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px]">
                                Enabled
                              </span>
                            ) : (
                              <span className="px-1.5 py-0 bg-stone-100 text-stone-500 border border-stone-200 rounded text-[10px]">
                                Disabled
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTestConnection(integration.integrationId)}
                              disabled={testMutation.isPending}
                              className="h-7 px-1.5 text-xs"
                            >
                              {testMutation.isPending ? (
                                <Spinner size="sm" />
                              ) : (
                                <>
                                  <RotateCw className="h-3.5 w-3.5 mr-0.5" />
                                  Test
                                </>
                              )}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedIntegration(
                                selectedIntegration?.integrationId === integration.integrationId
                                  ? null
                                  : integration
                              )}
                              className="h-7 px-1.5 text-xs"
                            >
                              <Settings className="h-3.5 w-3.5 mr-0.5" />
                              Configure
                            </Button>
                          </div>
                        </div>

                        {integration.description && (
                          <p className="text-[11px] text-stone-500 mb-1.5 line-clamp-1">{integration.description}</p>
                        )}

                        {/* Error Message */}
                        {integration.status === 'ERROR' && integration.lastError && (
                          <div className="px-2 py-1 bg-rose-50 border border-rose-200 rounded mb-1.5">
                            <p className="text-[11px] text-rose-700">{integration.lastError}</p>
                          </div>
                        )}

                        {/* Last Checked */}
                        {integration.lastChecked && (
                          <p className="text-[10px] text-stone-400">
                            Last checked: {new Date(integration.lastChecked).toLocaleString()}
                          </p>
                        )}

                        {/* Configuration Panel */}
                        {selectedIntegration?.integrationId === integration.integrationId && (
                          <div className="mt-2 pt-2 border-t border-stone-200">
                            <h5 className="text-xs font-medium text-stone-900 mb-1.5">Configuration</h5>
                            <div className="space-y-1.5">
                              {integration.config && Object.entries(integration.config).map(([key, value]) => {
                                const isSecret = key.toLowerCase().includes('secret') ||
                                  key.toLowerCase().includes('password') ||
                                  key.toLowerCase().includes('key') ||
                                  key.toLowerCase().includes('token')

                                return (
                                  <div key={key} className="flex items-center gap-4">
                                    <label className="text-sm font-medium text-stone-600 w-32 flex-shrink-0">
                                      {key}
                                    </label>
                                    <div className="flex-1 flex items-center gap-2">
                                      <Input
                                        type={isSecret && !showSecrets[key] ? 'password' : 'text'}
                                        value={isSecret && !showSecrets[key] ? maskSecret(String(value)) : String(value)}
                                        readOnly
                                        className="font-mono text-sm"
                                      />
                                      {isSecret && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleSecretVisibility(key)}
                                        >
                                          {showSecrets[key] ? (
                                            <EyeOff className="h-4 w-4" />
                                          ) : (
                                            <Eye className="h-4 w-4" />
                                          )}
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(String(value))}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}

                              {integration.webhookUrl && (
                                <div className="flex items-center gap-4">
                                  <label className="text-sm font-medium text-stone-600 w-32 flex-shrink-0">
                                    Webhook URL
                                  </label>
                                  <div className="flex-1 flex items-center gap-2">
                                    <Input
                                      type="text"
                                      value={integration.webhookUrl}
                                      readOnly
                                      className="font-mono text-sm"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(integration.webhookUrl!)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {integration.documentationUrl && (
                                <a
                                  href={integration.documentationUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800"
                                >
                                  View Documentation
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-stone-500">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                  <p className="text-sm">No {config.label.toLowerCase()} integrations configured</p>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* API Keys Section */}
      <Card className="border-l-4 border-l-amber-500">
        <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Key className="h-5 w-5 text-amber-700" />
          </div>
          API Keys
        </h3>
        <p className="text-sm text-stone-600 mb-4">
          API keys allow external applications to integrate with the FYP system.
        </p>

        <div className="space-y-3">
          <div className="p-4 border border-stone-200 rounded-lg bg-stone-50/50 hover:border-stone-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-stone-900">Production API Key</h4>
                <p className="text-sm text-stone-500">Full access to production endpoints</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs">
                Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type={showSecrets['prodKey'] ? 'text' : 'password'}
                value={showSecrets['prodKey'] ? 'fyp_prod_sk_1234567890abcdef' : '••••••••••••••••'}
                readOnly
                className="font-mono text-sm bg-white"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSecretVisibility('prodKey')}
                className="text-stone-600 hover:text-stone-900"
              >
                {showSecrets['prodKey'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('fyp_prod_sk_1234567890abcdef')}
                className="text-stone-600 hover:text-stone-900"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-stone-400 mt-2">Created: Jan 15, 2025 • Last used: Today</p>
          </div>

          <div className="p-4 border border-stone-200 rounded-lg bg-stone-50/50 hover:border-stone-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-stone-900">Test API Key</h4>
                <p className="text-sm text-stone-500">Limited access for testing</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs">
                Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type={showSecrets['testKey'] ? 'text' : 'password'}
                value={showSecrets['testKey'] ? 'fyp_test_sk_abcdef1234567890' : '••••••••••••••••'}
                readOnly
                className="font-mono text-sm bg-white"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSecretVisibility('testKey')}
                className="text-stone-600 hover:text-stone-900"
              >
                {showSecrets['testKey'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('fyp_test_sk_abcdef1234567890')}
                className="text-stone-600 hover:text-stone-900"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-stone-400 mt-2">Created: Jan 10, 2025 • Last used: Yesterday</p>
          </div>
        </div>

        <Button variant="secondary" className="mt-4 border-amber-300 text-amber-700 hover:bg-amber-50">
          <Key className="h-4 w-4 mr-2" />
          Generate New API Key
        </Button>
      </Card>
    </div>
  )
}
