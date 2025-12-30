'use client';

/**
 * Create New Persona Page
 * Page for creating a new persona from scratch
 */

import { PersonaForm } from '@/components/persona/PersonaForm';

export default function NewPersonaPage() {
  return <PersonaForm mode="create" />;
}
