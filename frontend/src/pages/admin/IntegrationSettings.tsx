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

const typeConfig: Record<IntegrationType, { label: string; icon: typeof Mail; description: string }> = {
  EMAIL: { label: 'Email Service', icon: Mail, description: 'SMTP configuration for sending emails' },
  STORAGE: { label: 'Cloud Storage', icon: Cloud, description: 'File storage for documents and uploads' },
  CALENDAR: { label: 'Calendar', icon: Database, description: 'Calendar integration for scheduling' },
  SSO: { label: 'Single Sign-On', icon: Key, description: 'Authentication provider integration' },
  API: { label: 'External API', icon: Globe, description: 'Third-party API connections' },
}

const statusConfig: Record<IntegrationStatus, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  CONNECTED: { label: 'Connected', color: 'text-success-600', bgColor: 'bg-success-50', icon: CheckCircle },
  DISCONNECTED: { label: 'Disconnected', color: 'text-neutral-600', bgColor: 'bg-neutral-100', icon: XCircle },
  ERROR: { label: 'Error', color: 'text-error-600', bgColor: 'bg-error-50', icon: AlertTriangle },
  PENDING: { label: 'Pending', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: RefreshCw },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Puzzle className="h-7 w-7 text-primary-600" />
            Integration Settings
          </h1>
          <p className="text-neutral-600 mt-1">
            Configure external services and API connections
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-neutral-500">Total Integrations</p>
          <p className="text-2xl font-bold text-neutral-900">{data?.integrations.length || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-neutral-500">Connected</p>
          <p className="text-2xl font-bold text-success-600">
            {data?.integrations.filter((i) => i.status === 'CONNECTED').length || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-neutral-500">Errors</p>
          <p className="text-2xl font-bold text-error-600">
            {data?.integrations.filter((i) => i.status === 'ERROR').length || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-neutral-500">Pending</p>
          <p className="text-2xl font-bold text-warning-600">
            {data?.integrations.filter((i) => i.status === 'PENDING').length || 0}
          </p>
        </Card>
      </div>

      {/* Integrations by Type */}
      <div className="space-y-6">
        {Object.entries(typeConfig).map(([type, config]) => {
          const integrations = integrationsByType[type as IntegrationType] || []
          const Icon = config.icon

          return (
            <Card key={type} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{config.label}</h3>
                    <p className="text-sm text-neutral-500">{config.description}</p>
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
                        className="p-4 border border-neutral-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-neutral-900">{integration.name}</h4>
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1',
                              status.bgColor,
                              status.color
                            )}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </span>
                            {integration.isEnabled ? (
                              <span className="px-2 py-0.5 bg-success-50 text-success-600 rounded-full text-xs">
                                Enabled
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full text-xs">
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
                              variant="outline"
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
                          <p className="text-sm text-neutral-500 mb-3">{integration.description}</p>
                        )}

                        {/* Error Message */}
                        {integration.status === 'ERROR' && integration.lastError && (
                          <div className="p-3 bg-error-50 rounded-lg mb-3">
                            <p className="text-sm text-error-700">{integration.lastError}</p>
                          </div>
                        )}

                        {/* Last Checked */}
                        {integration.lastChecked && (
                          <p className="text-xs text-neutral-400">
                            Last checked: {new Date(integration.lastChecked).toLocaleString()}
                          </p>
                        )}

                        {/* Configuration Panel */}
                        {selectedIntegration?.integrationId === integration.integrationId && (
                          <div className="mt-4 pt-4 border-t border-neutral-200">
                            <h5 className="font-medium text-neutral-900 mb-3">Configuration</h5>
                            <div className="space-y-3">
                              {integration.config && Object.entries(integration.config).map(([key, value]) => {
                                const isSecret = key.toLowerCase().includes('secret') ||
                                  key.toLowerCase().includes('password') ||
                                  key.toLowerCase().includes('key') ||
                                  key.toLowerCase().includes('token')

                                return (
                                  <div key={key} className="flex items-center gap-4">
                                    <label className="text-sm font-medium text-neutral-600 w-32 flex-shrink-0">
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
                                  <label className="text-sm font-medium text-neutral-600 w-32 flex-shrink-0">
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
                                  className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
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
                <div className="text-center py-8 text-neutral-500">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                  <p className="text-sm">No {config.label.toLowerCase()} integrations configured</p>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* API Keys Section */}
      <Card className="p-6">
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-primary-600" />
          API Keys
        </h3>
        <p className="text-sm text-neutral-600 mb-4">
          API keys allow external applications to integrate with the FYP system.
        </p>

        <div className="space-y-3">
          <div className="p-4 border border-neutral-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-neutral-900">Production API Key</h4>
                <p className="text-sm text-neutral-500">Full access to production endpoints</p>
              </div>
              <span className="px-2 py-0.5 bg-success-50 text-success-600 rounded-full text-xs">
                Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type={showSecrets['prodKey'] ? 'text' : 'password'}
                value={showSecrets['prodKey'] ? 'fyp_prod_sk_1234567890abcdef' : '••••••••••••••••'}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSecretVisibility('prodKey')}
              >
                {showSecrets['prodKey'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('fyp_prod_sk_1234567890abcdef')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-neutral-400 mt-2">Created: Jan 15, 2025 • Last used: Today</p>
          </div>

          <div className="p-4 border border-neutral-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-neutral-900">Test API Key</h4>
                <p className="text-sm text-neutral-500">Limited access for testing</p>
              </div>
              <span className="px-2 py-0.5 bg-success-50 text-success-600 rounded-full text-xs">
                Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type={showSecrets['testKey'] ? 'text' : 'password'}
                value={showSecrets['testKey'] ? 'fyp_test_sk_abcdef1234567890' : '••••••••••••••••'}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSecretVisibility('testKey')}
              >
                {showSecrets['testKey'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('fyp_test_sk_abcdef1234567890')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-neutral-400 mt-2">Created: Jan 10, 2025 • Last used: Yesterday</p>
          </div>
        </div>

        <Button variant="outline" className="mt-4">
          <Key className="h-4 w-4 mr-2" />
          Generate New API Key
        </Button>
      </Card>
    </div>
  )
}
