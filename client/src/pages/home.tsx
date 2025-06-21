import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Download, Upload, Save, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FriendCard } from "@/components/friend-card";
import { FriendEditModal } from "@/components/friend-edit-modal";
import { useToast } from "@/hooks/use-toast";
import { LocalStorageService } from "@/lib/local-storage";
import { apiRequest } from "@/lib/queryClient";
import type { Friend } from "@shared/schema";

export default function Home() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [autoSave, setAutoSave] = useState(true);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load settings from local storage on mount
  useEffect(() => {
    const settings = LocalStorageService.loadSettings();
    setAutoSave(settings.autoSaveFriends);
  }, []);

  const { data: friends = [], isLoading } = useQuery<Friend[]>({
    queryKey: ['/api/friends'],
  });

  const deleteFriendMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/friends/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({
        title: "Success",
        description: "Friend deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to delete friend:", error);
      toast({
        title: "Error",
        description: "Failed to delete friend",
        variant: "destructive",
      });
    },
  });

  const handleEditFriend = (friend: Friend) => {
    setEditingFriend(friend);
    setIsEditModalOpen(true);
  };

  const handleCreateFriend = () => {
    setEditingFriend(null);
    setIsEditModalOpen(true);
  };

  const handleDeleteFriend = (friendId: number) => {
    if (autoSave) {
      LocalStorageService.removeFriend(friendId);
    }
    deleteFriendMutation.mutate(friendId);
  };

  const handleModalSave = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
    setIsEditModalOpen(false);
    setEditingFriend(null);
  };

  const handleExportFriends = () => {
    try {
      const exportData = LocalStorageService.exportFriends();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `virtual-friends-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Friends exported to JSON file",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export friends data",
        variant: "destructive",
      });
    }
  };

  const handleImportFriends = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const success = LocalStorageService.importFriends(jsonData);
        
        if (success) {
          queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
          toast({
            title: "Import Successful",
            description: "Friends imported successfully",
          });
        } else {
          throw new Error("Invalid JSON format");
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Could not import friends data",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const handleBackupSave = () => {
    try {
      LocalStorageService.saveFriends(friends);
      LocalStorageService.saveSettings({ autoSaveFriends: autoSave });
      
      toast({
        title: "Backup Saved",
        description: "All friend data backed up locally",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Could not save backup",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading virtual friends...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Virtual Friends Manager
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Create and manage your virtual friends with unique personalities and voices
          </p>
        </div>

        {/* Action Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <Button onClick={handleCreateFriend} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Friend
              </Button>
              
              <Button onClick={handleBackupSave} variant="outline" className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Backup
              </Button>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleExportFriends} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              
              <Button variant="outline" className="flex items-center gap-2" asChild>
                <label htmlFor="import-file" className="cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Import
                </label>
              </Button>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImportFriends}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Friends Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Your Virtual Friends ({friends.length})
          </h2>
          
          {friends.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No virtual friends created yet.
              </p>
              <Button onClick={handleCreateFriend} className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Create Your First Friend
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {friends.map((friend: Friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  textInput="Sample text for voice preview"
                  playbackSpeed={1.0}
                  masterVolume={75}
                  onEdit={() => handleEditFriend(friend)}
                  onDelete={() => handleDeleteFriend(friend.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Friend Edit Modal */}
        <FriendEditModal
          friend={editingFriend}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleModalSave}
        />
      </div>
    </div>
  );
}