// components/admin/RiderVerifyCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface RiderVerifyCardProps {
  rider: {
    id: string;
    transportType: string;
    licenseDoc: string | null;
    bikeDoc: string | null;
    availability: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      status: string;
      createdAt: Date;
    };
  };
}

export default function RiderVerifyCard({ rider }: RiderVerifyCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!confirm(`Approve rider: ${rider.user.name}?`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/riders/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riderId: rider.id }),
      });

      if (res.ok) {
        alert("Rider approved successfully!");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to approve rider");
      }
    } catch (error) {
      alert("Error approving rider");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Reason for rejection (will be sent to rider):");
    if (!reason) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/riders/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riderId: rider.id, reason }),
      });

      if (res.ok) {
        alert("Rider rejected");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reject rider");
      }
    } catch (error) {
      alert("Error rejecting rider");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg gap-4">
      <div className="flex-1">
        <h3 className="font-semibold text-lg">{rider.user.name}</h3>
        <p className="text-sm text-gray-600">{rider.user.email}</p>
        <p className="text-sm text-gray-500">{rider.user.phone}</p>
        <p className="text-sm text-gray-500 mt-1">
          Transport: {rider.transportType || "Not specified"}
        </p>
        {rider.licenseDoc && (
          <a
            href={rider.licenseDoc}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
          >
            View License Document
          </a>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleReject}
          disabled={loading}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Reject
        </Button>
      </div>
    </div>
  );
}
