'use client';

/**
 * Edit Persona Page
 * Page for editing an existing persona
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PersonaForm } from '@/components/persona/PersonaForm';
import { usePersonaStore } from '@/stores';
import type { Persona } from '@/types';

export default function EditPersonaPage() {
  const params = useParams();
  const router = useRouter();
  const { getPersona } = usePersonaStore();

  const [persona, setPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const personaId = params.id as string;

  useEffect(() => {
    if (personaId) {
      const foundPersona = getPersona(personaId);
      if (foundPersona) {
        setPersona(foundPersona);
      } else {
        setNotFound(true);
      }
      setIsLoading(false);
    }
  }, [personaId, getPersona]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-semibold">Persona Not Found</h1>
        <p className="text-muted-foreground">
          The persona you're looking for doesn't exist or has been deleted.
        </p>
        <button
          onClick={() => router.push('/personas')}
          className="text-primary hover:underline"
        >
          Back to Personas
        </button>
      </div>
    );
  }

  return (
    <PersonaForm
      mode="edit"
      personaId={personaId}
      initialData={persona ?? undefined}
    />
  );
}
