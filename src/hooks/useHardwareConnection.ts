import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

interface SensorData {
  sensor1: number;
  sensor2: number;
  sensor3: number;
  timestamp: number;
  time: string;
}

interface HardwareStatus {
  connected: boolean;
  hasData: boolean;
  lastUpdate: number | null;
}

export const useHardwareConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const EDGE_FUNCTION_URL = '/functions/v1/hardware-connection';

  // Vérifier le statut de connexion
  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}/status`);
      const status: HardwareStatus = await response.json();
      setIsConnected(status.connected);
      return status;
    } catch (error) {
      console.error('Erreur vérification statut:', error);
      setIsConnected(false);
      return { connected: false, hasData: false, lastUpdate: null };
    }
  }, []);

  // Récupérer les données actuelles
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}/data`);
      const result = await response.json();
      
      if (result.connected && result.data) {
        setCurrentData(result.data);
        setIsConnected(true);
      } else {
        setIsConnected(result.connected || false);
        if (!result.connected) {
          setCurrentData(null);
        }
      }
      
      return result.data;
    } catch (error) {
      console.error('Erreur récupération données:', error);
      setIsConnected(false);
      setCurrentData(null);
      return null;
    }
  }, []);

  // Se connecter au hardware
  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}/connect`, {
        method: 'POST'
      });
      const result = await response.json();
      
      setIsConnected(result.connected);
      
      if (result.connected) {
        toast({
          title: "Connexion établie",
          description: "Connecté au hardware avec succès",
        });
      } else {
        toast({
          title: "Échec de connexion",
          description: result.message || "Impossible de se connecter au hardware",
          variant: "destructive",
        });
      }
      
      return result.connected;
    } catch (error) {
      console.error('Erreur connexion:', error);
      setIsConnected(false);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter au hardware",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  // Se déconnecter du hardware
  const disconnect = useCallback(async () => {
    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}/disconnect`, {
        method: 'POST'
      });
      const result = await response.json();
      
      setIsConnected(false);
      setCurrentData(null);
      
      toast({
        title: "Déconnexion",
        description: "Déconnecté du hardware",
      });
      
      return true;
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      setIsConnected(false);
      setCurrentData(null);
      return false;
    }
  }, [toast]);

  // Polling des données quand connecté
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      fetchData();
    }, 1000); // Récupérer les données chaque seconde

    return () => clearInterval(interval);
  }, [isConnected, fetchData]);

  // Vérification initiale du statut
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    isConnected,
    currentData,
    isConnecting,
    connect,
    disconnect,
    fetchData,
    checkStatus
  };
};