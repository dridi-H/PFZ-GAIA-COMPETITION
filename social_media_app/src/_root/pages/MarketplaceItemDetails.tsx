import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  MessageCircle, 
  MapPin, 
  Clock, 
  Tag,
  Edit,
  Trash2,
  CheckCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Loader, MarketplaceBackButton } from "@/components/shared";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/context/AuthContext";
import { 
  useGetMarketplaceItemById, 
  useDeleteMarketplaceItem,
  useMarkItemAsSold
} from "@/lib/react-query/marketplaceQueries";
import { multiFormatDateString } from "@/lib/utils";

const MarketplaceItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserContext();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: item, isLoading } = useGetMarketplaceItemById(id);
  const { mutate: deleteItem } = useDeleteMarketplaceItem();
  const { mutate: markAsSold } = useMarkItemAsSold();

  const isOwner = user?.id === item?.seller_id;

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
        return 'text-green-500 bg-green-500/10';
      case 'Like New':
        return 'text-blue-500 bg-blue-500/10';
      case 'Good':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'Fair':
        return 'text-orange-500 bg-orange-500/10';
      default:
        return 'text-light-3 bg-dark-3';
    }
  };
  
  const handleContactSeller = () => {
    if (!item) return;

    // Navigate to messenger with pre-filled message
    const message = `Hi! I'm interested in your ${item.title} listed for ${formatPrice(item.price)}`;
    navigate(`/messenger?to=${item.seller_id}&message=${encodeURIComponent(message)}&item=${item.id}`);
  };

  const handleDeleteItem = () => {
    if (!item) return;
    
    if (window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      deleteItem(
        { itemId: item.id, imagePaths: item.image_paths },
        {
          onSuccess: () => {
            navigate("/marketplace");
          }
        }
      );
    }
  };

  const handleMarkAsSold = () => {
    if (!item) return;
    
    if (window.confirm("Mark this item as sold? This will remove it from active listings.")) {
      markAsSold({ itemId: item.id, userId: user?.id || "" });
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!item) {
    return (
      <div className="marketplace-item-details-container">
        <div className="text-center py-20">
          <h3 className="h3-bold text-light-1 mb-2">Item not found</h3>
          <p className="text-light-3 body-medium mb-6">
            The item you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/marketplace")} className="shad-button_primary">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="marketplace-item-details-container">
      <div className="marketplace-item-details-inner">
        <div className="hidden md:flex max-w-5xl w-full">
          <MarketplaceBackButton />
        </div>
        
        {/* Header - REMOVED: Heart, Share, and Flag icons */}
        
        <div className="marketplace-item-details-content">
          {/* Images Section */}
          <div className="marketplace-item-details-images">
            {item.images && item.images.length > 0 ? (
              <div className="marketplace-image-gallery">
                {/* Main Image */}
                <div className="marketplace-main-image">
                  <img
                    src={item.images[currentImageIndex]}
                    alt={item.title}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  
                  {item.status === 'sold' && (
                    <div className="absolute inset-0 bg-dark-1/80 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="h3-bold text-white mb-2">SOLD</h3>
                        <p className="text-light-3">This item has been sold</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Image Thumbnails */}
                {item.images.length > 1 && (
                  <div className="marketplace-image-thumbnails">
                    {item.images.map((image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`marketplace-thumbnail ${
                          currentImageIndex === index ? 'active' : ''
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${item.title} ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="marketplace-no-image">
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-light-3 body-medium">No images available</p>
                </div>
              </div>
            )}
          </div>

          {/* Item Information */}
          <div className="marketplace-item-details-info">
            {/* Price and Title */}
            <div className="marketplace-item-header">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="marketplace-item-title">{item.title}</h1>
                  <div className="marketplace-item-price">{formatPrice(item.price)}</div>
                </div>
                
                {item.status === 'sold' && (
                  <div className="marketplace-sold-badge">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Sold
                  </div>
                )}
              </div>
              
              {/* Item Meta */}
              <div className="marketplace-item-meta">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className={`marketplace-condition-badge ${getConditionColor(item.condition)}`}>
                    <Tag className="h-3 w-3 mr-1" />
                    {item.condition}
                  </div>
                  
                  {item.category && (
                    <div className="marketplace-category-badge">
                      <span className="mr-1">{item.category.icon}</span>
                      {item.category.name}
                    </div>
                  )}
                  
                  <div className="flex items-center text-light-3 small-medium">
                    <MapPin className="h-3 w-3 mr-1" />
                    {item.location}
                  </div>
                  
                  <div className="flex items-center text-light-3 small-medium">
                    <Clock className="h-3 w-3 mr-1" />
                    {multiFormatDateString(item.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="marketplace-item-description">
              <h3 className="body-bold text-light-1 mb-3">Description</h3>
              <p className="text-light-2 body-regular whitespace-pre-wrap">
                {item.description}
              </p>
            </div>

            {/* Seller Information */}
            <div className="marketplace-seller-info">
              <h3 className="body-bold text-light-1 mb-3">Seller Information</h3>
              
              <Link to={`/profile/${item.seller.id}`} className="marketplace-seller-card">
                <img
                  src={item.seller.image_url || "/assets/icons/profile-placeholder.svg"}
                  alt={item.seller.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <p className="body-bold text-light-1">{item.seller.name}</p>
                  <p className="small-medium text-light-3">@{item.seller.username}</p>
                </div>
              </Link>
            </div>

            {/* Contact/Actions Section */}
            <div className="marketplace-item-actions">
              {isOwner ? (
                <div className="marketplace-owner-actions">
                  <div className="flex gap-3 mb-4">
                    <Link 
                      to={`/marketplace/item/${item.id}/edit`}
                      className="flex-1"
                    >
                      <Button 
                        variant="outline" 
                        className="w-full bg-dark-4 border-dark-4 text-light-1 hover:bg-dark-3 hover:text-light-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Listing
                      </Button>
                    </Link>
                    
                    {item.status === 'active' && (
                      <Button
                        onClick={handleMarkAsSold}
                        className="flex-1 bg-primary-500 text-white hover:bg-primary-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Sold
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleDeleteItem}
                    variant="outline"
                    className="w-full bg-transparent border-red/20 text-red hover:bg-red/10 hover:text-red"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Listing
                  </Button>
                </div>
              ) : (
                <div className="marketplace-contact-actions">
                  {item.status === 'active' ? (
                    <Button
                      onClick={handleContactSeller}
                      className="w-full bg-primary-500 text-white hover:bg-primary-600 mb-3"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message Seller
                    </Button>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-light-3 body-medium">This item is no longer available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceItemDetails;