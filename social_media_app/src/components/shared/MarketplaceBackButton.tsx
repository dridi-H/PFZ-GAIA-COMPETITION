import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface MarketplaceBackButtonProps {
  to?: string;
  className?: string;
}

const MarketplaceBackButton = ({ to, className = "" }: MarketplaceBackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      onClick={handleBack}
      variant="ghost"
      className={`shad-button_ghost ${className}`}
    >
      <img
        src="/assets/icons/back.svg"
        alt="back"
        width={24}
        height={24}
      />
      <p className="small-medium lg:base-medium">Back</p>
    </Button>
  );
};

export default MarketplaceBackButton;
