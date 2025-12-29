// app/admin/verify/page.tsx
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building2, Bike } from "lucide-react";
import PharmacyVerifyCard from "@/components/admin/PharmacyVerifyCard";
import RiderVerifyCard from "@/components/admin/RiderVerifyCard";

export default async function VerifyPage() {
  // Fetch pending pharmacies and riders directly from database
  const [pharmacies, riders] = await Promise.all([
    prisma.pharmacy.findMany({
      where: {
        verified: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.rider.findMany({
      where: {
        verified: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Verify Users</h1>

      {/* Pending Pharmacies */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Pending Pharmacies ({pharmacies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pharmacies.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              No pending pharmacies
            </p>
          ) : (
            <div className="space-y-4">
              {pharmacies.map((pharmacy) => (
                <PharmacyVerifyCard key={pharmacy.id} pharmacy={pharmacy} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Riders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bike className="h-5 w-5" />
            Pending Riders ({riders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {riders.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No pending riders</p>
          ) : (
            <div className="space-y-4">
              {riders.map((rider) => (
                <RiderVerifyCard key={rider.id} rider={rider} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
