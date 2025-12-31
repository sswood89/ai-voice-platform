'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Persona {
  id: string;
  name: string;
  avatar: string | null;
}

export default function NewEmbedPage() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    personaId: '',
    welcomeMessage: '',
    primaryColor: '#6366f1',
    theme: 'auto',
    position: 'bottom-right',
    allowedOrigins: '',
    rateLimit: 100,
  });

  useEffect(() => {
    fetchPersonas();
  }, []);

  async function fetchPersonas() {
    try {
      // Fetch personas from the existing API or store
      const res = await fetch('/api/personas');
      if (res.ok) {
        const data = await res.json();
        setPersonas(data.personas || []);
      }
    } catch (error) {
      console.error('Failed to fetch personas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch('/api/embeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          personaId: form.personaId,
          welcomeMessage: form.welcomeMessage || null,
          primaryColor: form.primaryColor,
          theme: form.theme,
          position: form.position,
          allowedOrigins: form.allowedOrigins
            .split('\n')
            .map((o) => o.trim())
            .filter(Boolean),
          rateLimit: form.rateLimit,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create embed');
      }

      router.push('/dashboard/embeds');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create embed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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

        <h1 className="text-2xl font-bold mb-2">Create Widget Embed</h1>
        <p className="text-muted-foreground mb-8">
          Configure a chat widget to embed on your website
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Widget Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="My Website Chat"
              required
            />
            <p className="text-xs text-muted-foreground">
              A name to identify this widget in your dashboard
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="persona">Persona</Label>
            <Select
              value={form.personaId}
              onValueChange={(value) => setForm({ ...form, personaId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a persona" />
              </SelectTrigger>
              <SelectContent>
                {personas.map((persona) => (
                  <SelectItem key={persona.id} value={persona.id}>
                    {persona.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The AI persona that will power this widget
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Welcome Message (optional)</Label>
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
                  <SelectItem value="auto">Auto (match system)</SelectItem>
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
            <Label htmlFor="allowedOrigins">Allowed Origins (optional)</Label>
            <textarea
              id="allowedOrigins"
              value={form.allowedOrigins}
              onChange={(e) => setForm({ ...form, allowedOrigins: e.target.value })}
              placeholder="https://example.com&#10;https://app.example.com&#10;*.example.com"
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              One origin per line. Use * for wildcard subdomains. Leave empty to allow all origins.
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
            <Button type="submit" disabled={saving || !form.personaId}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Embed
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
