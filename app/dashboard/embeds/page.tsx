'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ExternalLink, Copy, MoreVertical, Trash2, Settings, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Embed {
  id: string;
  name: string;
  is_active: boolean;
  primary_color: string;
  created_at: string;
  persona: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export default function EmbedsPage() {
  const [embeds, setEmbeds] = useState<Embed[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchEmbeds();
  }, []);

  async function fetchEmbeds() {
    try {
      const res = await fetch('/api/embeds');
      if (res.ok) {
        const data = await res.json();
        setEmbeds(data.embeds);
      }
    } catch (error) {
      console.error('Failed to fetch embeds:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEmbed(id: string) {
    if (!confirm('Are you sure you want to delete this embed?')) return;

    try {
      const res = await fetch(`/api/embeds/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEmbeds(embeds.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete embed:', error);
    }
  }

  function copyEmbedCode(embed: Embed) {
    const baseUrl = window.location.origin;
    const code = `<script src="${baseUrl}/widget.js" data-embed-id="${embed.id}"></script>`;
    navigator.clipboard.writeText(code);
    setCopied(embed.id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Widget Embeds</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage chat widgets for your websites
            </p>
          </div>
          <Link href="/dashboard/embeds/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Embed
            </Button>
          </Link>
        </div>

        {embeds.length === 0 ? (
          <div className="text-center py-16 border rounded-lg">
            <div className="text-muted-foreground mb-4">
              No embeds yet. Create your first widget to add AI chat to your website.
            </div>
            <Link href="/dashboard/embeds/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Embed
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {embeds.map((embed) => (
              <div
                key={embed.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: embed.primary_color }}
                  >
                    {embed.persona?.avatar ? (
                      <img
                        src={embed.persona.avatar}
                        alt={embed.persona.name}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      embed.persona?.name?.charAt(0) || 'W'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{embed.name}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          embed.is_active
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-gray-500/10 text-gray-600'
                        }`}
                      >
                        {embed.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {embed.persona?.name || 'No persona'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyEmbedCode(embed)}
                  >
                    {copied === embed.id ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>

                  <Link
                    href={`/widget/${embed.id}`}
                    target="_blank"
                    className="p-2 hover:bg-muted rounded-md"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/embeds/${embed.id}`}>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteEmbed(embed.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
