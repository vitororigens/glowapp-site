"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Info
} from 'lucide-react';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subscriptionData: any;
  loading?: boolean;
}

export default function CancelSubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  subscriptionData,
  loading = false
}: CancelSubscriptionModalProps) {
  const [confirmed, setConfirmed] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
  };

  const getDaysUntilExpiration = (timestamp: number) => {
    const now = new Date();
    const expiration = new Date(timestamp * 1000);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm();
  };

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancelar Assinatura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Aviso Principal */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Tem certeza que deseja cancelar sua assinatura?
            </AlertDescription>
          </Alert>

          {/* O que acontece após o cancelamento */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">O que acontece após o cancelamento:</h4>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <strong>Você mantém acesso completo</strong> até{' '}
                  {subscriptionData ? formatDate(subscriptionData.current_period_end) : 'o final do período atual'}
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <strong>Não haverá renovação automática</strong> - sua assinatura não será cobrada novamente
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <strong>Após o vencimento</strong>, você perderá acesso às funcionalidades pagas
                </div>
              </div>
            </div>
          </div>

          {/* Data de vencimento */}
          {subscriptionData && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div className="text-sm">
                <div className="font-semibold">Vencimento</div>
                <div className="text-gray-600">
                  {formatDate(subscriptionData.current_period_end)} 
                  ({getDaysUntilExpiration(subscriptionData.current_period_end)} dias restantes)
                </div>
              </div>
            </div>
          )}

          {/* Informação adicional */}
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Você pode reativar sua assinatura a qualquer momento antes do vencimento.
            </AlertDescription>
          </Alert>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Manter Assinatura
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Cancelando...' : 'Sim, Cancelar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
