import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, Heart, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Loader, MarketplaceBackButton } from "@/components/shared";
import { useUserContext } from "@/context/AuthContext";
import { useGetUserMarketplaceItems, useDeleteMarketplaceItem, useMarkItemAsSold, useMarkItemAsActive } from "@/lib/react-query/marketplaceQueries";
import { IMarketplaceItem } from "@/types";
import { multiFormatDateString } from "@/lib/utils";

const MyMarketplaceListings = () => {
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState<'active' | 'sold' | 'all'>('active');

  const { data: allItems, isLoading: loadingAll } = useGetUserMarketplaceItems(user?.id || "");
  const { data: activeItems, isLoading: loadingActive } = useGetUserMarketplaceItems(user?.id || "", 'active');
  const { data: soldItems, isLoading: loadingSold } = useGetUserMarketplaceItems(user?.id || "", 'sold');
  const { mutate: deleteItem } = useDeleteMarketplaceItem();
  const { mutate: markAsSold } = useMarkItemAsSold();
  const { mutate: markAsActive } = useMarkItemAsActive(); // You'll need to add this to your queries

  const getItemsForTab = () => {
    switch (activeTab) {
      case 'active':
        return activeItems || [];
      case 'sold':
        return soldItems || [];
      case 'all':
      default:
        return allItems || [];
    }
  };

  const isLoading = loadingAll || loadingActive || loadingSold;
  const items = getItemsForTab();

  const handleDeleteItem = (item: IMarketplaceItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.title}"? This action cannot be undone.`)) {
      deleteItem({ itemId: item.id, imagePaths: item.image_paths });
    }
  };

  const handleMarkAsSold = (item: IMarketplaceItem) => {
    if (window.confirm(`Mark "${item.title}" as sold?`)) {
      markAsSold({ itemId: item.id, userId: user?.id || "" });
    }
  };

  const handleMarkAsActive = (item: IMarketplaceItem) => {
    if (window.confirm(`Mark "${item.title}" as active again?`)) {
      markAsActive({ itemId: item.id, userId: user?.id || "" });
    }
  };

  return (    <div className="my-listings-container">
      <div className="my-listings-inner_container">
        <div className="hidden md:flex max-w-5xl w-full">
          <MarketplaceBackButton to="/marketplace" />
        </div>
        
        {/* Header */}
        <div className="my-listings-header">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="h3-bold md:h2-bold text-left w-full">My Listings</h2>
              <p className="text-light-3 small-medium md:base-regular mt-2">
                Manage your marketplace items
              </p>
            </div>
            
            <Link to="/marketplace/create">
              <Button className="shad-button_primary">
                <Plus className="h-4 w-4 mr-2" />
                New Listing
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs - Fixed styling for better visibility */}
        <div className="my-listings-tabs">
          <div className="flex items-center gap-1 p-1 bg-dark-2 rounded-lg w-fit border border-dark-4">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'active' 
                  ? 'bg-primary-500 text-white shadow-md' 
                  : 'text-light-2 hover:text-light-1 hover:bg-dark-3'
              }`}
            >
              Active ({activeItems?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('sold')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'sold' 
                  ? 'bg-primary-500 text-white shadow-md' 
                  : 'text-light-2 hover:text-light-1 hover:bg-dark-3'
              }`}
            >
              Sold ({soldItems?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'all' 
                  ? 'bg-primary-500 text-white shadow-md' 
                  : 'text-light-2 hover:text-light-1 hover:bg-dark-3'
              }`}
            >
              All ({allItems?.length || 0})
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="my-listings-content">
          {isLoading ? (
            <Loader />
          ) : (
            <>
              {items.length > 0 ? (
                <div className="my-listings-grid">
                  {items.map((item: IMarketplaceItem) => (
                    <MyListingCard
                      key={item.id}
                      item={item}
                      onDelete={() => handleDeleteItem(item)}
                      onMarkSold={() => handleMarkAsSold(item)}
                      onMarkActive={() => handleMarkAsActive(item)}
                    />
                  ))}
                </div>
              ) : (
                <div className="my-listings-empty">
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="h3-bold text-light-1 mb-2">
                      {activeTab === 'active' && "No active listings"}
                      {activeTab === 'sold' && "No sold items"}
                      {activeTab === 'all' && "No listings yet"}
                    </h3>                    <p className="text-light-3 body-medium mb-6">
                      {activeTab === 'active' && "Create your first listing to start selling"}
                      {activeTab === 'sold' && "Items you've sold will appear here"}
                      {activeTab === 'all' && "Start by creating your first marketplace listing"}
                    </p>
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

// My Listing Card Component
const MyListingCard = ({ 
  item, 
  onDelete, 
  onMarkSold,
  onMarkActive
}: { 
  item: IMarketplaceItem; 
  onDelete: () => void; 
  onMarkSold: () => void; 
  onMarkActive: () => void;
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="my-listing-badge active">Active</span>;
      case 'sold':
        return <span className="my-listing-badge sold">Sold</span>;
      case 'expired':
        return <span className="my-listing-badge expired">Expired</span>;
      default:
        return <span className="my-listing-badge">{status}</span>;
    }
  };

  return (
    <div className="my-listing-card">
      {/* Image */}
      <div className="my-listing-image">
        {item.images && item.images.length > 0 ? (
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-dark-3 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-light-4 small-medium">No image</p>
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          {getStatusBadge(item.status)}
        </div>
      </div>

      {/* Content */}
      <div className="my-listing-content">
        <div className="flex justify-between items-start mb-2">
          <h3 className="my-listing-title">{item.title}</h3>
          <span className="my-listing-price">{formatPrice(item.price)}</span>
        </div>

        <p className="my-listing-description">{item.description}</p>

        {/* Meta Info */}
        <div className="my-listing-meta">
          <div className="flex items-center gap-4 text-light-3 small-medium">
            {item.favorites_count && (
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {item.favorites_count} favorites
              </div>
            )}
            <span>{multiFormatDateString(item.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full">
          <Link to={`/marketplace/item/${item.id}`} className="w-full">
            <button className="w-full bg-dark-3 text-light-1 py-2 px-4 rounded-md hover:bg-dark-2 transition-colors flex items-center justify-center gap-2">
              <Eye className="h-4 w-4" />
              View Listing
            </button>
          </Link>

          {item.status === 'active' && (
            <Link to={`/marketplace/item/${item.id}/edit`} className="w-full">
              <button className="w-full bg-dark-3 text-light-1 py-2 px-4 rounded-md hover:bg-dark-2 transition-colors flex items-center justify-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Listing
              </button>
            </Link>
          )}

          {item.status === 'active' && (
            <button
              onClick={onMarkSold}
              className="w-full bg-dark-3 text-light-1 py-2 px-4 rounded-md hover:bg-dark-2 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Mark as Sold
            </button>
          )}

          {item.status === 'sold' && (
            <button
              onClick={onMarkActive}
              className="w-full bg-green-600/10 text-green-400 border border-green-600/20 py-2 px-4 rounded-md hover:bg-green-600/20 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Mark as Active
            </button>
          )}

          <button
            onClick={onDelete}
            className="w-full bg-red-600/10 text-red-400 border border-red-600/20 py-2 px-4 rounded-md hover:bg-red-600/20 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Listing
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyMarketplaceListings;   