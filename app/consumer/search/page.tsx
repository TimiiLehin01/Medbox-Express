"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Plus, Minus } from "lucide-react";
import { formatPrice } from "@/lib/utils";
// Removed Image import - using regular img tag instead

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  prescriptionRequired: boolean;
  pharmacyId: string;
  pharmacyName: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load all products on initial page load
  useEffect(() => {
    loadProducts();
  }, []);

  // Auto-search as user types (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        loadProducts(searchQuery);
      } else {
        loadProducts(); // Load all if search is empty
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer); // Clear timeout if user keeps typing
  }, [searchQuery]);

  const loadProducts = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = query
        ? `/api/products?search=${encodeURIComponent(query)}`
        : "/api/products";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      console.log("Products loaded:", data.length);
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
      setError("Failed to load products. Please try again.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    if (!searchQuery.trim()) {
      // If search is empty, load all products
      loadProducts();
      return;
    }

    loadProducts(searchQuery);
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find((item) => item.productId === product.id);

    let newCart;
    if (existingItem) {
      newCart = cart.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          prescriptionRequired: product.prescriptionRequired,
          pharmacyId: product.pharmacyId,
          pharmacyName: product.pharmacy.name,
        },
      ];
    }

    setCart(newCart);
    // Save to localStorage
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, change: number) => {
    const newCart = cart
      .map((item) => {
        if (item.productId === productId) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      })
      .filter((item) => item.quantity > 0);

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Search Medicine</h1>

      {/* Search Bar */}
      <div className="flex gap-2 mb-8">
        <Input
          placeholder="Search for medicines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && searchProducts()}
          className="flex-1"
        />
        <Button onClick={searchProducts} disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="lg:col-span-2 space-y-4">
          {error ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => loadProducts()} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </CardContent>
            </Card>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  {searchQuery
                    ? "No products found"
                    : "No products available yet"}
                </p>
                {searchQuery && (
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      loadProducts();
                    }}
                    variant="outline"
                  >
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-2">
                Found {products.length} product
                {products.length !== 1 ? "s" : ""}
              </p>
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-24 h-24 object-cover rounded"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs text-center">
                            No image
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {product.pharmacy?.name || "Unknown Pharmacy"}
                        </p>
                        {product.description && (
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="outline">{product.category}</Badge>
                          {product.pharmacy?.verified && (
                            <Badge variant="default" className="bg-green-600">
                              Verified ✓
                            </Badge>
                          )}
                          {product.prescriptionRequired && (
                            <Badge variant="secondary">Rx Required</Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            In stock: {product.quantity}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xl font-bold text-blue-600">
                            {formatPrice(product.price)}
                          </span>
                          <Button onClick={() => addToCart(product)} size="sm">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Cart */}
        <div>
          <Card className="sticky top-4">
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart ({cart.length})
              </h3>

              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Cart is empty</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cart.map((item) => (
                      <div key={item.productId} className="border-b pb-3">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-sm">
                            {item.name}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-600 text-xs hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {item.pharmacyName}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="p-1 border rounded hover:bg-gray-100"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="p-1 border rounded hover:bg-gray-100"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="font-semibold text-sm">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 mb-4">
                    <div className="flex justify-between mb-2">
                      <span>Subtotal</span>
                      <span className="font-semibold">
                        {formatPrice(cartTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Delivery</span>
                      <span className="font-semibold">{formatPrice(500)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">
                        {formatPrice(cartTotal + 500)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      localStorage.setItem("cart", JSON.stringify(cart));
                      router.push("/consumer/checkout");
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
