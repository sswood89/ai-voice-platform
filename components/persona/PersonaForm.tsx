'use client';

/**
 * PersonaForm Component
 * Main tabbed form for creating and editing personas
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { usePersonaStore } from '@/stores';
import { BasicInfoEditor } from './BasicInfoEditor';
import { VoiceSelector } from './VoiceSelector';
import { PersonalityEditor } from './PersonalityEditor';
import { BehaviorEditor } from './BehaviorEditor';
import { KnowledgeEditor } from './KnowledgeEditor';
import type {
  Persona,
  PersonaVoiceConfig,
  PersonaPersonalityConfig,
  PersonaKnowledgeConfig,
  PersonaBehaviorConfig,
  CreatePersonaInput,
} from '@/types';
import { DEFAULT_VOICES } from '@/lib/voice';

interface PersonaFormProps {
  mode: 'create' | 'edit';
  personaId?: string;
  initialData?: Persona;
}

// Default values for a new persona
const getDefaultFormData = (): CreatePersonaInput => ({
  name: '',
  description: '',
  voice: {
    voiceId: DEFAULT_VOICES.rachel,
    stability: 0.5,
    similarityBoost: 0.75,
  },
  personality: {
    traits: [],
    tone: 'casual',
    style: 'conversational',
    customInstructions: '',
  },
  knowledge: {
    domain: '',
    context: '',
  },
  behavior: {
    responseLength: 'medium',
    useEmoji: false,
    acknowledgeUncertainty: true,
    askClarifyingQuestions: true,
    mode: 'assistant',
  },
});

export function PersonaForm({ mode, personaId, initialData }: PersonaFormProps) {
  const router = useRouter();
  const { createPersona, updatePersona, getPersona } = usePersonaStore();

  const [formData, setFormData] = useState<CreatePersonaInput>(
    initialData
      ? {
          name: initialData.name,
          description: initialData.description,
          avatar: initialData.avatar,
          voice: { ...initialData.voice },
          personality: { ...initialData.personality, traits: [...initialData.personality.traits] },
          knowledge: { ...initialData.knowledge },
          behavior: { ...initialData.behavior },
        }
      : getDefaultFormData()
  );

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Load persona data for edit mode
  useEffect(() => {
    if (mode === 'edit' && personaId && !initialData) {
      const persona = getPersona(personaId);
      if (persona) {
        setFormData({
          name: persona.name,
          description: persona.description,
          avatar: persona.avatar,
          voice: { ...persona.voice },
          personality: { ...persona.personality, traits: [...persona.personality.traits] },
          knowledge: { ...persona.knowledge },
          behavior: { ...persona.behavior },
        });
      }
    }
  }, [mode, personaId, getPersona, initialData]);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [formData]);

  const updateField = useCallback(<K extends keyof CreatePersonaInput>(
    field: K,
    value: CreatePersonaInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateVoice = useCallback((voice: PersonaVoiceConfig) => {
    setFormData((prev) => ({ ...prev, voice }));
  }, []);

  const updatePersonality = useCallback((personality: PersonaPersonalityConfig) => {
    setFormData((prev) => ({ ...prev, personality }));
  }, []);

  const updateKnowledge = useCallback((knowledge: PersonaKnowledgeConfig) => {
    setFormData((prev) => ({ ...prev, knowledge }));
  }, []);

  const updateBehavior = useCallback((behavior: PersonaBehaviorConfig) => {
    setFormData((prev) => ({ ...prev, behavior }));
  }, []);

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Name is required';
    }
    if (!formData.description.trim()) {
      return 'Description is required';
    }
    if (formData.personality.traits.length === 0) {
      return 'At least one personality trait is required';
    }
    return null;
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'create') {
        const newPersona = createPersona(formData);
        toast.success('Persona created successfully');
        router.push(`/personas/${newPersona.id}`);
      } else if (personaId) {
        updatePersona({ id: personaId, ...formData });
        toast.success('Persona updated successfully');
        setHasChanges(false);
      }
    } catch (err) {
      toast.error('Failed to save persona');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    router.push('/personas');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {mode === 'create' ? 'Create New Persona' : 'Edit Persona'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'create'
                ? 'Configure your AI assistant personality'
                : `Editing: ${formData.name || 'Untitled'}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Persona
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabbed Form */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-6 pt-4 border-b">
            <TabsList className="grid w-full max-w-2xl grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="personality">Personality</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <TabsContent value="basic" className="mt-0">
                <BasicInfoEditor
                  name={formData.name}
                  description={formData.description}
                  avatar={formData.avatar}
                  onNameChange={(name) => updateField('name', name)}
                  onDescriptionChange={(description) => updateField('description', description)}
                  onAvatarChange={(avatar) => updateField('avatar', avatar)}
                />
              </TabsContent>

              <TabsContent value="voice" className="mt-0">
                <VoiceSelector
                  voiceConfig={formData.voice}
                  onChange={updateVoice}
                />
              </TabsContent>

              <TabsContent value="personality" className="mt-0">
                <PersonalityEditor
                  personality={formData.personality}
                  mode={formData.behavior.mode}
                  onChange={updatePersonality}
                />
              </TabsContent>

              <TabsContent value="behavior" className="mt-0">
                <BehaviorEditor
                  behavior={formData.behavior}
                  onChange={updateBehavior}
                />
              </TabsContent>

              <TabsContent value="knowledge" className="mt-0">
                <KnowledgeEditor
                  knowledge={formData.knowledge}
                  onChange={updateKnowledge}
                />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
