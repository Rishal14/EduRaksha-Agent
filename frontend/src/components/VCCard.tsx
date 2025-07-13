import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VCCardProps {
  vc: {
    id: string;
    type: string;
    issuer: string;
    issuedDate: string;
    expiryDate: string;
    claims: Record<string, string | number | boolean>;
    status: 'active' | 'expired' | 'revoked';
  };
  onGenerateZKP?: (vcId: string) => void;
  onViewDetails?: (vcId: string) => void;
  showActions?: boolean;
}

export function VCCard({ vc, onGenerateZKP, onViewDetails, showActions = true }: VCCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'revoked': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EducationalCredential': return 'bg-blue-100 text-blue-800';
      case 'IncomeCredential': return 'bg-green-100 text-green-800';
      case 'CasteCredential': return 'bg-purple-100 text-purple-800';
      case 'DisabilityCredential': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge className={getTypeColor(vc.type)}>
              {vc.type.replace('Credential', '')}
            </Badge>
            <Badge className={getStatusColor(vc.status)}>
              {vc.status}
            </Badge>
          </div>
          <div className="text-xs text-gray-500">
            {vc.id}
          </div>
        </div>
        <CardTitle className="text-lg">{vc.issuer}</CardTitle>
        <CardDescription>
          Issued: {new Date(vc.issuedDate).toLocaleDateString()} | 
          Expires: {new Date(vc.expiryDate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          {Object.entries(vc.claims).slice(0, 4).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-600 capitalize">{key}:</span>
              <span className="font-medium">{String(value)}</span>
            </div>
          ))}
        </div>
        
        {showActions && (
          <div className="flex space-x-2">
            {onGenerateZKP && (
              <Button 
                size="sm" 
                onClick={() => onGenerateZKP(vc.id)}
                className="flex-1"
              >
                Generate ZKP
              </Button>
            )}
            {onViewDetails && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onViewDetails(vc.id)}
                className="flex-1"
              >
                View Details
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 