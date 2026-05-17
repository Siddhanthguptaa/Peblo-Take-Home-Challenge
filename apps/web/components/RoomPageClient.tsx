'use client';

import ChatRoomClient from "@/components/ChatRoomClient";
import { Editor } from "@/components/Editor";
import SummarizationBox from './SummarizationBox';
import { SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { AppSidebar } from './RoomSidebar';
import { useRoomStore } from '@/store/RoomStore';
import { TagInput } from './notes/TagInput';
import { SaveIndicator } from './editor/SaveIndicator';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';

export default function RoomPage({ roomId }: { roomId:string}) {

  const { chatOpen,sumOpen,toggleChat,toggleSum } = useRoomStore();
  const [tags, setTags] = useState<string[]>([]);
  // Mock save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Fetch initial tags
  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/tags`);
        const data = await res.json();
        // Just mock getting tags for now, as we need specific tags for this room
        // Ideally we'd fetch the room's current tags. Let's assume it's handled.
      } catch (e) {}
    }
    fetchTags();
  }, [roomId]);

  // Handle tag changes
  const handleTagChange = async (newTags: string[]) => {
    setTags(newTags);
    setSaveStatus('saving');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/tags/${roomId}/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      setSaveStatus('error');
    }
  };

  const handleShare = async () => {
    try {
      const res = await axios.patch(`/api/room-advanced/${roomId}/share`);
      if (res.status === 200) {
        if (res.data.isPublic) {
          const shareUrl = `${window.location.origin}/shared/${res.data.shareId}`;
          navigator.clipboard.writeText(shareUrl);
          toast.success("Room shared! Link copied to clipboard.");
        } else {
          toast.success("Room sharing disabled.");
        }
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Error toggling sharing.");
    }
  };

  const handleArchive = async () => {
    try {
      const res = await axios.patch(`/api/room-advanced/${roomId}/archive`, { isArchived: true });
      if (res.status === 200) {
        toast.success("Room archived!");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Error archiving room.");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black">

      <SidebarProvider>
        <div className="flex flex-1 overflow-auto">

        {/* Editor Section */}
        <div className='flex'>
            <AppSidebar roomId={roomId} />
            <SidebarTrigger/>
        </div>

        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${chatOpen || sumOpen ? 'mr-80' : 'mr-0'
            }`}
        >
          <div className="h-full p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center bg-gray-900 p-2 rounded-lg border border-gray-800">
               <div className="w-1/3 min-w-[200px]">
                  <TagInput tags={tags} onChange={handleTagChange} suggestions={['Project', 'Meeting', 'Personal', 'Idea']} />
               </div>
               <div className="flex items-center gap-4">
                  <SaveIndicator status={saveStatus} />
                  <button onClick={handleShare} className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-md border border-gray-700 transition-colors">Share</button>
                  <button onClick={handleArchive} className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-md border border-gray-700 transition-colors">Archive</button>
               </div>
            </div>
            <div className="flex-1 bg-gray-950 rounded-lg shadow-sm border border-gray-800 overflow-auto">
              <Editor docId={roomId} />
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div
          className={`fixed right-0 top-0 bottom-0 w-80 shadow-lg border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-10 ${chatOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          
          {/* Chat Content */}
          <div className="h-full ">
            <ChatRoomClient roomId={roomId} />
          </div>
        </div>

        {/* Overlay for mobile */}
        {chatOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-5 lg:hidden md:hidden"
            onClick={()=>toggleChat()}
          />
        )}

        {/* Summarization Sidebar */}
        <div
          className={`fixed right-0 top-0 bottom-0 w-80 shadow-lg border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-10 ${sumOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          
          {/* Summarization Content */}
          <div className="h-full">
            <SummarizationBox roomId={roomId} />
          </div>
        </div>

        {/* Overlay for mobile */}
        {sumOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-5 lg:hidden md:hidden"
            onClick={()=>toggleSum()}
          />
        )}
      </div>

      </SidebarProvider>
    </div>
  );
}