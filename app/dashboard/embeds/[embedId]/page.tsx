'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Embed {
  id: string;
  name: string;
  persona_id: string;
  welcome_message: string | null;
  primary_color: string;
  theme: string;
  position: string;
  allowed_origins: string[];
  rate_limit: number;
  is_active: boolean;
  persona?: {
    id: string;
    name: string;
  };
}

export default function EditEmbedPage() {
  const params = useParams();
  const router = useRouter();
  const embedId = params.embedId as string;

  const [embed, setEmbed] = useState<Embed | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: '',
    welcomeMessage: '',
    primaryColor: '#6366f1',
    theme: 'auto',
    position: 'bottom-right',
    allowedOrigins: '',
    rateLimit: 100,
    isActive: true,
  });

  useEffect(() => {
    fetchEmbed();
  }, [embedId]);

  async function fetchEmbed() {
    try {
      const res = await fetch(`/api/embeds/${embedId}`);
      if (!res.ok) {
        throw new Error('Embed not found');
      }
      const data = await res.json();
      setEmbed(data.embed);
      setForm({
        name: data.embed.name,
        welcomeMessage: data.embed.welcome_message || '',
        primaryColor: data.embed.primary_color,
        theme: data.embed.theme,
        position: data.embed.position,
        allowedOrigins: data.embed.allowed_origins.join('\n'),
        rateLimit: data.embed.rate_limit,
        isActive: data.embed.is_active,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load embed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/embeds/${embedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          welcomeMessage: form.welcomeMessage || null,
          primaryColor: form.primaryColor,
          theme: form.theme,
          position: form.position,
          allowedOrigins: form.allowedOrigins
            .split('\n')
            .map((o) => o.trim())
            .filter(Boolean),
          rateLimit: form.rateLimit,
          isActive: form.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update embed');
      }

      router.push('/dashboard/embeds');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update embed');
    } finally {
      setSaving(false);
    }
  }

  function copyEmbedCode() {
    const baseUrl = window.location.origin;
    const code = `<script src="${baseUrl}/widget.js" data-embed-id="${embedId}"></script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error && !embed) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Link href="/dashboard/embeds">
            <Button variant="outline">Back to Embeds</Button>
          </Link>
        </div>
      </div>
    );
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const embedCode = `<script src="${baseUrl}/widget.js" data-embed-id="${embedId}"></script>`;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard/embeds"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Embeds
        </Link>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">Edit Widget</h1>
            <p className="text-muted-foreground">
              Persona: {embed?.persona?.name}
            </p>
          </div>
          <Link href={`/widget/${embedId}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </Link>
        </div>

        {/* Embed Code */}
        <div className="mb-8 p-4 rounded-lg bg-muted">
          <Label className="mb-2 block">Embed Code</Label>
          <div className="flex gap-2">
            <code className="flex-1 p-2 bg-background rounded text-sm overflow-x-auto">
              {embedCode}
            </code>
            <Button variant="outline" size="sm" onClick={copyEmbedCode}>
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Add this script tag to your website to display the chat widget.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="isActive">Widget Active</Label>
              <p className="text-xs text-muted-foreground">
                Disable to temporarily hide the widget
              </p>
            </div>
            <Switch
              id="isActive"
              checked={form.isActive}
              onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Widget Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Welcome Message</Label>
            <Input
              id="welcomeMessage"
              value={form.welcomeMessage}
              onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
              placeholder="Hi! How can I help you today?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="primaryColor"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={form.theme}
                onValueChange={(value) => setForm({ ...form, theme: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Widget Position</Label>
            <Select
              value={form.position}
              onValueChange={(value) => setForm({ ...form, position: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allowedOrigins">Allowed Origins</Label>
            <textarea
              id="allowedOrigins"
              value={form.allowedOrigins}
              onChange={(e) => setForm({ ...form, allowedOrigins: e.target.value })}
              placeholder="https://example.com"
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              One origin per line. Leave empty to allow all.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
            <Input
              id="rateLimit"
              type="number"
              min={10}
              max={1000}
              value={form.rateLimit}
              onChange={(e) => setForm({ ...form, rateLimit: parseInt(e.target.value) || 100 })}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
            <Link href="/dashboard/embeds">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
