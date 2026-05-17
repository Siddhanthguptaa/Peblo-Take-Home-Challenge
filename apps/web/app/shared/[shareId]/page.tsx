import { redirect } from "next/navigation";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";

async function getSharedRoom(shareId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/room-advanced/shared/${shareId}`, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      return null;
    }
    
    return res.json();
  } catch (error) {
    console.error("Failed to fetch shared room", error);
    return null;
  }
}

export default async function SharedRoomPage({ params }: { params: Promise<{ shareId: string }> }) {
  const resolvedParams = await params;
  const room = await getSharedRoom(resolvedParams.shareId);

  if (!room) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Room not found</h1>
          <p className="text-gray-400">This link is invalid or the room is no longer shared.</p>
        </div>
      </div>
    );
  }

  // A basic read-only view since this is public.
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold">{room.title || "Untitled Room"}</h1>
          <div className="text-sm text-gray-400 mt-2">
            Shared publicly • Read only
          </div>
        </header>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
          <SimpleEditor docId={room.id.toString()} userId="Anonymous" readOnly={true} />
        </div>
      </div>
    </div>
  );
}
