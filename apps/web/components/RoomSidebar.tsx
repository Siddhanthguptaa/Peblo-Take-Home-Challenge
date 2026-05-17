import { Home, LogOut, MessageCircleMore, Text } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useRoomStore } from "@/store/RoomStore"
import { useRouter } from "next/navigation";
import { NotesSearch } from "./notes/NotesSearch";
import { useState, useCallback } from "react";
import axios from "@/lib/axios";

// Menu items.

export function AppSidebar({roomId}:{roomId:string}) {
    const router = useRouter();
    const {handleLogout,toggleChat,toggleSum} = useRoomStore();
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = useCallback(async (filter: any) => {
        setIsSearching(true);
        try {
            const res = await axios.get('/api/room-advanced/search/rooms', { params: filter });
            setSearchResults(res.data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const items = [
        {
            title: "Dashboard",
            onClick:()=> router.push("/dashboard"), 
            icon: Home,
        },
        {
            title: "Chat",
            onClick:()=>toggleChat(),
            icon: MessageCircleMore,
        },
        {
            title: "Summarizer/Grammar-check",
            onClick:()=>toggleSum(),
            icon: Text,
        },
        {
            title: "Logout",
            onClick: ()=>handleLogout(router),
            icon: LogOut,
        },
    ]
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Room:{roomId}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title} className="cursor-pointer">
                                    <SidebarMenuButton asChild>
                                        <div onClick={item.onClick}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </div>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>Search Notes</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <NotesSearch onFilter={handleSearch} />
                        <div className="mt-4 flex flex-col gap-2 px-2 pb-4">
                            {isSearching ? <p className="text-xs text-muted-foreground">Searching...</p> : null}
                            {!isSearching && searchResults.length === 0 ? <p className="text-xs text-muted-foreground">No notes found.</p> : null}
                            {searchResults.map((room: any) => (
                                <div key={room.id} onClick={() => router.push(`/room/${room.id}`)} className="p-2 border border-border rounded-md cursor-pointer hover:bg-accent text-sm transition-colors">
                                    <p className="font-medium text-foreground truncate">{room.title || 'Untitled'}</p>
                                    <p className="text-xs text-muted-foreground truncate">{room.content || 'Empty note'}</p>
                                </div>
                            ))}
                        </div>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}