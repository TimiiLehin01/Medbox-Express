// components/admin/PharmacyVerifyCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface PharmacyVerifyCardProps {
  pharmacy: {
    id: string;
    name: string;
    address: string;
    licenseDoc: string | null;
    cacDoc: string | null;
    openTime: string | null;
    closeTime: string | null;
    deliveryRadius: number;
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

export default function PharmacyVerifyCard({
  pharmacy,
}: PharmacyVerifyCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!confirm(`Approve pharmacy: ${pharmacy.name}?`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/pharmacies/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pharmacyId: pharmacy.id }),
      });

      if (res.ok) {
        alert("Pharmacy approved successfully!");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to approve pharmacy");
      }
    } catch (error) {
      alert("Error approving pharmacy");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Reason for rejection (will be sent to user):");
    if (!reason) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/pharmacies/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pharmacyId: pharmacy.id, reason }),
      });

      if (res.ok) {
        alert("Pharmacy rejected");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reject pharmacy");
      }
    } catch (error) {
      alert("Error rejecting pharmacy");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg gap-4">
      <div className="flex-1">
        <h3 className="font-semibold text-lg">{pharmacy.name}</h3>
        <p className="text-sm text-gray-600">{pharmacy.user.name}</p>
        <p className="text-sm text-gray-500">{pharmacy.user.email}</p>
        <p className="text-sm text-gray-500">{pharmacy.user.phone}</p>
        <p className="text-sm text-gray-500 mt-1">{pharmacy.address}</p>
        {pharmacy.licenseDoc && (
          <a
            href={pharmacy.licenseDoc}
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
