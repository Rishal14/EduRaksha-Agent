"use client";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { AgentChat } from "@/components/AgentChat";

interface Claim {
  income: number;
  caste: string;
  marks: number;
}
interface Scholarship {
  id: number;
  name: string;
}

export default function Dashboard() {
  const [claims, setClaims] = useState<Claim | null>(null);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard-data")
      .then(res => res.json())
      .then(data => {
        setClaims(data.claims);
        setScholarships(data.scholarships);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading dashboard...</div>;

  return (
    <main className="max-w-2xl mx-auto py-12">
      <h2 className="text-2xl font-bold mb-4">Your Verified Credentials</h2>
      <div className="flex gap-4 mb-8">
        <Badge variant="success">Income: {claims?.income}</Badge>
        <Badge variant="success">Caste: {claims?.caste}</Badge>
        <Badge variant="success">Marks: {claims?.marks}</Badge>
      </div>
      <h3 className="text-xl font-semibold mb-2">Eligible Scholarships</h3>
      <ul className="mb-8">
        {scholarships.map(s => (
          <li key={s.id} className="mb-2">{s.name}</li>
        ))}
      </ul>
      <AgentChat claims={claims} />
    </main>
  );
} 