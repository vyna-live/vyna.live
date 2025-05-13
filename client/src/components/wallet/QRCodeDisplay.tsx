import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  walletAddress: string;
  onClose: () => void;
  isPending: boolean;
}

export default function QRCodeDisplay({ walletAddress, onClose, isPending }: QRCodeDisplayProps) {
  const { toast } = useToast();
  
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: "Address copied",
      description: "Payment address copied to clipboard",
    });
  };
  
  return (
    <div className="flex flex-col">
      <div className="flex justify-center py-6">
        <div className="w-[260px] h-[260px] rounded-lg bg-white overflow-hidden">
          <img 
            src="/Untitled.png" 
            alt="Payment QR Code" 
            className="w-full h-full"
          />
        </div>
      </div>
      
      <div className="flex items-center bg-[#1a1a1a] p-3 mx-0 mb-6 rounded-lg border border-[#333] overflow-hidden">
        <div className="truncate text-sm text-neutral-300 px-2 flex-1">
          {walletAddress}
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 px-2"
          onClick={handleCopyAddress}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="border-[#333] text-white hover:bg-[#252525]"
          disabled={isPending}
        >
          Close
        </Button>
      </div>
    </div>
  );
}