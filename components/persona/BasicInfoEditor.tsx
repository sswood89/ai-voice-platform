'use client';

/**
 * BasicInfoEditor Component
 * Name, description, and avatar configuration
 */

import { Bot } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BasicInfoEditorProps {
  name: string;
  description: string;
  avatar?: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAvatarChange: (avatar: string | undefined) => void;
}

export function BasicInfoEditor({
  name,
  description,
  avatar,
  onNameChange,
  onDescriptionChange,
  onAvatarChange,
}: BasicInfoEditorProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Give your persona a name and description that reflects its purpose
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Persona avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Bot className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="avatar">Avatar URL (optional)</Label>
              <Input
                id="avatar"
                type="url"
                placeholder="https://example.com/avatar.png"
                value={avatar ?? ''}
                onChange={(e) => onAvatarChange(e.target.value || undefined)}
              />
              <p className="text-xs text-muted-foreground">
                Enter a URL to an image for your persona avatar
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Helpful Assistant, Code Mentor"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/50 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what this persona does and how it behaves..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters - This helps users understand what this persona is for
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Tips for great personas</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Be specific:</strong> Instead of "Assistant", try "Technical Writing Assistant" or "Python Code Reviewer"
          </p>
          <p>
            <strong>Add context:</strong> Include details about the target audience or use case in the description
          </p>
          <p>
            <strong>Keep it concise:</strong> Users should quickly understand what this persona does
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
