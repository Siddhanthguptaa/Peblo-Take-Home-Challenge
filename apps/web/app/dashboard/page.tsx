"use client";
import DashboardNav from "@/components/DashboardNav";
import { JoinRoomBox } from "@/components/JoinRoomBox";
import CreateRoomBox from "@/components/CreateRoomBox";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { useEffect, useState } from "react";
import axios from "@/lib/axios";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    archivedRooms: 0,
    totalAICalls: 0,
    totalTokens: 0,
  });
  
  const [weeklyData, setWeeklyData] = useState<{ date: string; calls: number }[]>([]);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await axios.get("/api/dashboard/insights");
        setStats({
          totalRooms: res.data.metrics.totalNotes || 0,
          archivedRooms: res.data.metrics.archivedNotes || 0,
          totalAICalls: res.data.metrics.totalAICalls || 0,
          totalTokens: res.data.metrics.totalTokens || 0,
        });
        if (res.data.weeklyActivity) {
          setWeeklyData(res.data.weeklyActivity);
        }
      } catch (e) {
        console.error("Failed to fetch dashboard insights", e);
      }
    }
    fetchInsights();
  }, []);

  return (
    <div>
      <DashboardNav />
      <div className="min-h-screen bg-black text-white py-10 px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-6">Your Activity</h2>
            <StatsGrid {...stats} />
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
            <WeeklyChart data={weeklyData} />
          </div>

          <div className="flex md:flex-row flex-col md:justify-evenly gap-8 items-center bg-gray-900 border border-gray-800 p-8 rounded-2xl">
            <CreateRoomBox />
            <div className="hidden md:block w-px h-64 bg-gray-700 mx-8" />
            <JoinRoomBox />
          </div>
          
        </div>
      </div>
    </div>
  );
}
