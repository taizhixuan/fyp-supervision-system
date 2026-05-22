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
  Sparkles,
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
      {/* Header */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
              <Puzzle className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Integration Settings
                <Sparkles className="h-5 w-5 text-amber-400" />
              </h1>
              <p className="text-stone-300 text-xs">
                Configure external services and API connections
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => refetch()} className="border-stone-600 text-white hover:bg-stone-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-stone-500">
          <p className="text-sm text-stone-500">Total Integrations</p>
          <p className="text-xl sm:text-2xl font-bold text-stone-900 leading-tight">{data?.integrations.length || 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-sm text-stone-500">Active</p>
          <p className="text-2xl font-bold text-emerald-700">
            {data?.integrations.filter((i) => i.status === 'ACTIVE').length || 0}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-rose-500">
          <p className="text-sm text-stone-500">Errors</p>
          <p className="text-2xl font-bold text-rose-700">
            {data?.integrations.filter((i) => i.status === 'ERROR').length || 0}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-sm text-stone-500">Configuring</p>
          <p className="text-2xl font-bold text-amber-700">
            {data?.integrations.filter((i) => i.status === 'CONFIGURING').length || 0}
          </p>
        </Card>
      </div>

      {/* Integrations by Type */}
      <div className="space-y-3 lg:space-y-4">
        {Object.entries(typeConfig).map(([type, config]) => {
          const integrations = integrationsByType[type as IntegrationType] || []
          const Icon = config.icon

          return (
            <Card key={type} className="hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', config.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900">{config.label}</h3>
                    <p className="text-sm text-stone-500">{config.description}</p>
                  </div>
                </div>
              </div>

              {integrations.length > 0 ? (
                <div className="space-y-3">
                  {integrations.map((integration) => {
                    const status = statusConfig[integration.status]
                    const StatusIcon = status.icon

                    return (
                      <div
                        key={integration.integrationId}
                        className="p-4 border border-stone-200 rounded-lg hover:border-stone-300 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-stone-900">{integration.name}</h4>
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border',
                              status.bgColor,
                              status.color,
                              status.borderColor
                            )}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </span>
                            {integration.isEnabled ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs">
                                Enabled
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-stone-100 text-stone-500 border border-stone-200 rounded-full text-xs">
                                Disabled
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTestConnection(integration.integrationId)}
                              disabled={testMutation.isPending}
                            >
                              {testMutation.isPending ? (
                                <Spinner size="sm" />
                              ) : (
                                <>
                                  <RotateCw className="h-4 w-4 mr-1" />
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
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Configure
                            </Button>
                          </div>
                        </div>

                        {integration.description && (
                          <p className="text-sm text-stone-500 mb-3">{integration.description}</p>
                        )}

                        {/* Error Message */}
                        {integration.status === 'ERROR' && integration.lastError && (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg mb-3">
                            <p className="text-sm text-rose-700">{integration.lastError}</p>
                          </div>
                        )}

                        {/* Last Checked */}
                        {integration.lastChecked && (
                          <p className="text-xs text-stone-400">
                            Last checked: {new Date(integration.lastChecked).toLocaleString()}
                          </p>
                        )}

                        {/* Configuration Panel */}
                        {selectedIntegration?.integrationId === integration.integrationId && (
                          <div className="mt-4 pt-4 border-t border-stone-200">
                            <h5 className="font-medium text-stone-900 mb-3">Configuration</h5>
                            <div className="space-y-3">
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
                <div className="text-center py-8 text-stone-500">
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
