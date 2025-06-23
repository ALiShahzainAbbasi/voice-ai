import { useState, useEffect } from "react";
import { MessageSquare, Mail, Twitter, Plus, Trash2, Save, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export interface ConversationContext {
  id: string;
  type: 'message' | 'email' | 'social' | 'document';
  title: string;
  content: string;
  source?: string;
  timestamp: Date;
  tags: string[];
}

interface ConversationContextProps {
  contexts: ConversationContext[];
  onContextsChange: (contexts: ConversationContext[]) => void;
  onContextApplied?: (context: string) => void;
}

export function ConversationContextManager({ contexts, onContextsChange, onContextApplied }: ConversationContextProps) {
  const [newContext, setNewContext] = useState<Partial<ConversationContext>>({
    type: 'message',
    title: '',
    content: '',
    source: '',
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { toast } = useToast();

  const contextTypeLabels = {
    message: { label: 'Text Message', icon: MessageSquare, color: 'bg-blue-100 text-blue-800' },
    email: { label: 'Email', icon: Mail, color: 'bg-green-100 text-green-800' },
    social: { label: 'Social Post', icon: Twitter, color: 'bg-purple-100 text-purple-800' },
    document: { label: 'Document', icon: FileText, color: 'bg-orange-100 text-orange-800' }
  };

  const handleAddContext = () => {
    if (!newContext.title?.trim() || !newContext.content?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and content for the context",
        variant: "destructive",
      });
      return;
    }

    const context: ConversationContext = {
      id: editingId || `context-${Date.now()}`,
      type: newContext.type as ConversationContext['type'],
      title: newContext.title.trim(),
      content: newContext.content.trim(),
      source: newContext.source?.trim() || '',
      timestamp: new Date(),
      tags: newContext.tags || []
    };

    if (editingId) {
      // Update existing context
      const updatedContexts = contexts.map(c => c.id === editingId ? context : c);
      onContextsChange(updatedContexts);
      toast({
        title: "Context Updated",
        description: "Conversation context has been updated successfully",
      });
    } else {
      // Add new context
      onContextsChange([...contexts, context]);
      toast({
        title: "Context Added",
        description: "New conversation context has been added successfully",
      });
    }

    // Reset form
    setNewContext({
      type: 'message',
      title: '',
      content: '',
      source: '',
      tags: []
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEditContext = (context: ConversationContext) => {
    setNewContext({
      type: context.type,
      title: context.title,
      content: context.content,
      source: context.source,
      tags: context.tags
    });
    setEditingId(context.id);
    setIsEditing(true);
  };

  const handleDeleteContext = (id: string) => {
    const updatedContexts = contexts.filter(c => c.id !== id);
    onContextsChange(updatedContexts);
    toast({
      title: "Context Deleted",
      description: "Conversation context has been removed",
    });
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const currentTags = newContext.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      setNewContext({
        ...newContext,
        tags: [...currentTags, newTag.trim()]
      });
    }
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    const currentTags = newContext.tags || [];
    setNewContext({
      ...newContext,
      tags: currentTags.filter(t => t !== tag)
    });
  };

  const generateConversationContext = () => {
    if (contexts.length === 0) return '';

    const contextSummary = contexts.map(context => {
      return `${context.type.toUpperCase()}: ${context.title}\n${context.content}${context.source ? `\nSource: ${context.source}` : ''}`;
    }).join('\n\n---\n\n');

    return `Previous conversation history and context:\n\n${contextSummary}`;
  };

  const handleApplyContext = () => {
    const contextString = generateConversationContext();
    if (contextString && onContextApplied) {
      onContextApplied(contextString);
      toast({
        title: "Context Applied",
        description: "Historical context has been applied to conversations",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('text/') && !file.name.endsWith('.txt')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a text file (.txt)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a text file smaller than 1MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setNewContext({
        ...newContext,
        type: 'document',
        title: file.name.replace('.txt', ''),
        content: content.trim()
      });
    };
    reader.readAsText(file);
  };

  const cancelEdit = () => {
    setNewContext({
      type: 'message',
      title: '',
      content: '',
      source: '',
      tags: []
    });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Context Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>{isEditing ? 'Edit Context' : 'Add Conversation Context'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Add historical messages, emails, and social posts to provide context for more personalized conversations. 
              Your virtual friends will reference this information during chats.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="context-type">Content Type</Label>
              <Select
                value={newContext.type}
                onValueChange={(value) => setNewContext({ ...newContext, type: value as ConversationContext['type'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">Text Message</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="social">Social Media Post</SelectItem>
                  <SelectItem value="document">Document/Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context-title">Title/Subject</Label>
              <Input
                id="context-title"
                value={newContext.title || ''}
                onChange={(e) => setNewContext({ ...newContext, title: e.target.value })}
                placeholder="e.g., Weekend plans discussion, Work project update"
                maxLength={100}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context-content">Content</Label>
            <Textarea
              id="context-content"
              value={newContext.content || ''}
              onChange={(e) => setNewContext({ ...newContext, content: e.target.value })}
              placeholder="Paste the message, email, or post content here..."
              rows={6}
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context-source">Source (Optional)</Label>
            <Input
              id="context-source"
              value={newContext.source || ''}
              onChange={(e) => setNewContext({ ...newContext, source: e.target.value })}
              placeholder="e.g., WhatsApp, Gmail, Twitter, @username"
              maxLength={50}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                maxLength={20}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {newContext.tags && newContext.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newContext.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload Text File</Label>
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <label htmlFor="context-file" className="cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Choose File
                </label>
              </Button>
              <input
                id="context-file"
                type="file"
                accept=".txt,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="text-sm text-gray-500">(.txt files only, max 1MB)</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAddContext} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {isEditing ? 'Update Context' : 'Add Context'}
            </Button>
            {isEditing && (
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Context List */}
      {contexts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Conversation Contexts ({contexts.length})</CardTitle>
              <Button onClick={handleApplyContext} variant="outline" size="sm">
                Apply to Conversations
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contexts.map((context) => {
                const typeInfo = contextTypeLabels[context.type];
                const IconComponent = typeInfo.icon;
                
                return (
                  <div
                    key={context.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-4 h-4" />
                        <Badge className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {context.title}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditContext(context)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteContext(context.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-3">
                      {context.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        {context.source && (
                          <span>Source: {context.source}</span>
                        )}
                        <span>{context.timestamp.toLocaleDateString()}</span>
                      </div>
                      {context.tags.length > 0 && (
                        <div className="flex gap-1">
                          {context.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}