import { Link } from "react-router-dom";
import { Plus, MapPin, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/shared";
import { useGetMarketplaceItems } from "@/lib/react-query/marketplaceQueries";
import { IMarketplaceItem } from "@/types";
import { multiFormatDateString } from "@/lib/utils";

const Marketplace = () => {
  const {
    data: marketplaceItems,
    isLoading: isLoadingItems
  } = useGetMarketplaceItems({
    limit: 50
  });

  return (
    <div className="marketplace-container">
      <div className="marketplace-inner_container">        {/* Header */}
        <div className="marketplace-header">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="h3-bold md:h2-bold text-left w-full">Marketplace</h2>
              <p className="text-light-3 small-medium md:base-regular mt-2">
                Buy and sell items with your community
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link to="/marketplace/my-listings">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  My Listings
                </Button>
              </Link>
              
              <Link to="/marketplace/create">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Sell Something
                </Button>
              </Link>
            </div>
          </div>
        </div>        {/* Items Grid */}
        <div className="marketplace-items-section">
          {isLoadingItems ? (
            <Loader />
          ) : (
            <>
              {marketplaceItems && marketplaceItems.length > 0 ? (
                <>
                  <div className="marketplace-items-count">
                    <p className="text-light-3 small-medium">
                      {marketplaceItems.length} item{marketplaceItems.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  
                  <div className="marketplace-items-grid">
                    {marketplaceItems.map((item: IMarketplaceItem) => (
                      <MarketplaceItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="marketplace-empty-state">
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🛍️</div>
                    <h3 className="h3-bold text-light-1 mb-2">No items found</h3>
                    <p className="text-light-3 body-medium mb-6">
                      Be the first to list an item!
                    </p>
                    <Link to="/marketplace/create">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Listing
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Marketplace Item Card Component
const MarketplaceItemCard = ({ item }: { item: IMarketplaceItem }) => {
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'New':
        return 'text-green-500';
      case 'Like New':
        return 'text-blue-500';
      case 'Good':
        return 'text-yellow-500';
      case 'Fair':
        return 'text-orange-500';
      default:
        return 'text-light-3';
    }
  };

  return (
    <Link to={`/marketplace/item/${item.id}`} className="marketplace-item-card">
      <div className="marketplace-item-image">
        {item.images && item.images.length > 0 ? (
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-48 object-cover rounded-t-lg"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-48 bg-dark-3 rounded-t-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-light-4 small-medium">No image</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="marketplace-item-content">
        <div className="flex justify-between items-start mb-2">
          <h3 className="marketplace-item-title">{item.title}</h3>
          <span className="marketplace-item-price">{formatPrice(item.price)}</span>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <span className={`marketplace-item-condition ${getConditionColor(item.condition)}`}>
            {item.condition}
          </span>
          {item.category && (
            <>
              <span className="text-light-4">•</span>
              <span className="text-light-3 small-medium">{item.category.name}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-1 mb-2">
          <MapPin className="h-3 w-3 text-light-4" />
          <span className="text-light-3 small-medium">{item.location}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">            
            <img
              src={item.seller?.image_url || "/assets/icons/profile-placeholder.svg"}
              alt={item.seller?.name || "User"}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-light-3 small-medium">@{item.seller?.username}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-light-4" />
            <span className="text-light-4 tiny-medium">
              {multiFormatDateString(item.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Marketplace;