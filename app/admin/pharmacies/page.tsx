// app/admin/pharmacies/page.tsx
import { prisma } from "@/lib/prisma";
import PharmacyApprovalCard from "@/components/admin/PharmacyApprovalCard";

export default async function PharmaciesPage() {
  const pharmacies = await prisma.pharmacy.findMany({
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
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Pharmacy Approvals</h1>
          <p className="text-gray-600 mt-2">
            Review and approve pharmacy registrations ({pharmacies.length}{" "}
            pending)
          </p>
        </div>

        {pharmacies.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No pending pharmacy approvals</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pharmacies.map((pharmacy) => (
              <PharmacyApprovalCard key={pharmacy.id} pharmacy={pharmacy} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
