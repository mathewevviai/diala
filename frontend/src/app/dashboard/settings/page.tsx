'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  UilSetting,
  UilKeySkeleton,
  UilBell,
  UilGlobe,
  UilDatabase,
  UilShield,
  UilSave,
  UilSync,
  UilExclamationTriangle
} from '@tooni/iconscout-unicons-react';

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = React.useState({
    openai: '•••••••••••••••••••••',
    deepgram: '•••••••••••••••••••••',
    elevenlabs: '•••••••••••••••••••••',
    telnyx: '•••••••••••••••••••••'
  });

  const [showKey, setShowKey] = React.useState<string | null>(null);

  return (
    <div className="h-full overflow-y-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black uppercase">Settings</h1>
        <p className="text-gray-600 font-bold">Configure your voice agent platform</p>
      </div>

      {/* API Configuration */}
      <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
        <CardHeader className="border-b-4 border-black">
          <CardTitle className="text-xl font-black uppercase flex items-center gap-2">
            <UilKeySkeleton className="h-6 w-6" />
            API CONFIGURATION
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="bg-yellow-100 border-2 border-black p-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-2">
              <UilExclamationTriangle className="h-5 w-5" />
              <p className="font-black uppercase">Security Notice</p>
            </div>
            <p className="text-sm">API keys are encrypted and stored securely. Never share your keys publicly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(apiKeys).map(([service, key]) => (
              <div key={service} className="space-y-2">
                <label className="text-sm font-black uppercase">{service} API KEY</label>
                <div className="flex gap-2">
                  <Input
                    type={showKey === service ? "text" : "password"}
                    value={key}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, [service]: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-black font-bold focus:outline-none focus:ring-4 focus:ring-[rgb(0,82,255)] focus:ring-offset-2"
                  />
                  <Button
                    variant="neutral"
                    onClick={() => setShowKey(showKey === service ? null : service)}
                    className="font-bold"
                  >
                    {showKey === service ? 'HIDE' : 'SHOW'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              variant="default"
              className="font-black uppercase"
            >
              <UilSave className="h-4 w-4 mr-2" />
              SAVE API KEYS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Agent Defaults */}
      <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
        <CardHeader className="border-b-4 border-black">
          <CardTitle className="text-xl font-black uppercase flex items-center gap-2">
            <UilGlobe className="h-6 w-6" />
            VOICE AGENT DEFAULTS
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black uppercase">Default Language</label>
              <select 
                className="w-full px-4 py-2 border-2 border-black font-bold focus:outline-none focus:ring-4 focus:ring-[rgb(0,82,255)] focus:ring-offset-2"
              >
                <option>English (US)</option>
                <option>Spanish (MX)</option>
                <option>French (FR)</option>
                <option>German (DE)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-black uppercase">Default Voice</label>
              <select 
                className="w-full px-4 py-2 border-2 border-black font-bold focus:outline-none focus:ring-4 focus:ring-[rgb(0,82,255)] focus:ring-offset-2"
              >
                <option>Professional</option>
                <option>Friendly</option>
                <option>Energetic</option>
                <option>Calm</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black uppercase">Call Timeout (seconds)</label>
              <Input
                type="number"
                defaultValue="300"
                className="border-2 border-black font-bold focus:outline-none focus:ring-4 focus:ring-[rgb(0,82,255)] focus:ring-offset-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black uppercase">Max Concurrent Calls</label>
              <Input
                type="number"
                defaultValue="10"
                className="border-2 border-black font-bold focus:outline-none focus:ring-4 focus:ring-[rgb(0,82,255)] focus:ring-offset-2"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              variant="default"
              className="font-black uppercase"
            >
              <UilSync className="h-4 w-4 mr-2" />
              UPDATE DEFAULTS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-4 border-black rounded-[16px] shadow-[4px_4px_0_rgba(0,0,0,1)]">
        <CardHeader className="border-b-4 border-black">
          <CardTitle className="text-xl font-black uppercase flex items-center gap-2">
            <UilBell className="h-6 w-6" />
            NOTIFICATIONS
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {[
            { id: 'email', label: 'Email notifications for completed calls', checked: true },
            { id: 'sms', label: 'SMS alerts for failed calls', checked: false },
            { id: 'webhook', label: 'Webhook notifications for all events', checked: true },
            { id: 'daily', label: 'Daily performance summary', checked: true }
          ].map((notification) => (
            <label key={notification.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={notification.checked}
                className="w-5 h-5 rounded border-2 border-black accent-[rgb(0,82,255)] focus:ring-4 focus:ring-[rgb(0,82,255)] focus:ring-offset-2"
              />
              <span className="font-bold">{notification.label}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-4 border-black rounded-[16px] shadow-[4px_4px_0_rgba(0,0,0,1)]">
        <CardHeader className="border-b-4 border-black">
          <CardTitle className="text-xl font-black uppercase flex items-center gap-2">
            <UilDatabase className="h-6 w-6" />
            DATA MANAGEMENT
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <CardContent className="p-4 text-center">
                <UilDatabase className="h-8 w-8 mx-auto mb-2" />
                <p className="font-black uppercase mb-2">Export Data</p>
                <p className="text-sm text-gray-600 mb-4">Download all call data</p>
                <Button 
                  variant="neutral" 
                  className="w-full font-bold"
                >
                  EXPORT
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <CardContent className="p-4 text-center">
                <UilSync className="h-8 w-8 mx-auto mb-2" />
                <p className="font-black uppercase mb-2">Backup</p>
                <p className="text-sm text-gray-600 mb-4">Create system backup</p>
                <Button 
                  variant="neutral" 
                  className="w-full font-bold"
                >
                  BACKUP
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] bg-red-50">
              <CardContent className="p-4 text-center">
                <UilExclamationTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="font-black uppercase mb-2">Clear Data</p>
                <p className="text-sm text-gray-600 mb-4">Delete all records</p>
                <Button 
                  variant="default"
                  className="w-full font-bold"
                >
                  CLEAR
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}