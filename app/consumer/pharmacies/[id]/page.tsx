"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import { MapPin, Star, Phone, Clock, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

export default function PharmacyDetailPage() {
  const params = useParams();
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPharmacy();
  }, []);

  const fetchPharmacy = async () => {
    try {
      const response = await fetch(`/api/pharmacies/${params.id}`);
      const data = await response.json();
      setPharmacy(data);
    } catch (error) {
      console.error("Failed to fetch pharmacy:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Pharmacy not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Pharmacy Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{pharmacy.name}</h1>
                {pharmacy.verified && <Badge variant="success">Verified</Badge>}
              </div>
              <div className="space-y-1 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {pharmacy.address}
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {pharmacy.user.phone}
                </div>
                {pharmacy.openTime && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {pharmacy.openTime} - {pharmacy.closeTime}
                  </div>
                )}
                {pharmacy.averageRating > 0 && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
                    {pharmacy.averageRating.toFixed(1)} (
                    {pharmacy.reviews.length} reviews)
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle>Available Products</CardTitle>
        </CardHeader>
        <CardContent>
          {pharmacy.products.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              No products available
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pharmacy.products.map((product: any) => (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={200}
                          height={200}
                          className="object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-400">No image</span>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {product.category}
                    </p>
                    {product.prescriptionRequired && (
                      <Badge variant="warning" className="mb-2">
                        Rx Required
                      </Badge>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(product.price)}
                      </span>
                      <Button size="sm">
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews */}
      {pharmacy.reviews.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Customer Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pharmacy.reviews.map((review: any) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center mb-2">
                    <span className="font-semibold mr-2">
                      {review.user.name}
                    </span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
