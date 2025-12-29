// app/admin/riders/page.tsx
import { prisma } from "@/lib/prisma";
import RiderApprovalCard from "@/components/admin/RiderVerifyCard";

export default async function RidersPage() {
  const riders = await prisma.rider.findMany({
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
          <h1 className="text-3xl font-bold">Rider Approvals</h1>
          <p className="text-gray-600 mt-2">
            Review and approve rider applications ({riders.length} pending)
          </p>
        </div>

        {riders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No pending rider approvals</p>
          </div>
        ) : (
          <div className="space-y-6">
            {riders.map((rider) => (
              <RiderApprovalCard key={rider.id} rider={rider} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
