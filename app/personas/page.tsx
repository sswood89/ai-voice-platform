'use client';

/**
 * Personas Page
 * Browse and manage AI personas
 */

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonaCard } from '@/components/persona/PersonaCard';
import { usePersonaStore } from '@/stores';
import { PERSONA_TEMPLATES, getTemplateCategories } from '@/lib/persona';

export default function PersonasPage() {
  const [search, setSearch] = useState('');
  const {
    personas,
    activePersonaId,
    setActivePersona,
    deletePersona,
    duplicatePersona,
    createFromTemplate,
  } = usePersonaStore();

  const filteredPersonas = personas.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  const categories = getTemplateCategories();

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Personas</h1>
          <p className="text-muted-foreground">
            Create and manage AI personalities
          </p>
        </div>
        <Link href="/personas/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Persona
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="my-personas">
        <TabsList>
          <TabsTrigger value="my-personas">My Personas</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="my-personas" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search personas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredPersonas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {search
                  ? 'No personas match your search'
                  : 'No personas yet. Create one to get started!'}
              </p>
              {!search && (
                <Link href="/personas/new">
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Persona
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPersonas.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  isActive={persona.id === activePersonaId}
                  onSelect={() => setActivePersona(persona.id)}
                  onEdit={() => {
                    // Navigate to edit page
                    window.location.href = `/personas/${persona.id}`;
                  }}
                  onDelete={() => deletePersona(persona.id)}
                  onDuplicate={() => duplicatePersona(persona.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {categories.map((category) => (
            <div key={category.id}>
              <h3 className="text-lg font-medium mb-3 capitalize">
                {category.label} ({category.count})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {PERSONA_TEMPLATES.filter((t) => t.category === category.id).map(
                  (template) => (
                    <div
                      key={template.templateId}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {template.personality.traits.slice(0, 3).map((trait) => (
                          <span
                            key={trait}
                            className="text-xs bg-secondary px-2 py-1 rounded"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full"
                        onClick={() => {
                          const persona = createFromTemplate(template.templateId);
                          if (persona) {
                            window.location.href = `/personas/${persona.id}`;
                          }
                        }}
                      >
                        Use Template
                      </Button>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
