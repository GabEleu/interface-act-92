import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SensorData {
  sensor1: number;
  sensor2: number;
  sensor3: number;
  timestamp: number;
  time: string;
}

let isConnected = false;
let sensorData: SensorData | null = null;
let tcpConnection: Deno.TcpConn | null = null;

// Configuration de connexion (par défaut : 192.168.4.1:3333)
const HARDWARE_HOST = Deno.env.get('HARDWARE_HOST') || '192.168.4.1';
const HARDWARE_PORT = parseInt(Deno.env.get('HARDWARE_PORT') || '3333');

async function connectToHardware(): Promise<boolean> {
  try {
    tcpConnection = await Deno.connect({
      hostname: HARDWARE_HOST,
      port: HARDWARE_PORT,
    });
    
    // Configuration TCP_NODELAY équivalente
    tcpConnection.setNoDelay(true);
    
    isConnected = true;
    console.log(`Connecté au hardware sur ${HARDWARE_HOST}:${HARDWARE_PORT}`);
    
    // Démarrer la lecture des données
    readHardwareData();
    
    return true;
  } catch (error) {
    console.error('Erreur de connexion hardware:', error);
    isConnected = false;
    return false;
  }
}

async function readHardwareData() {
  if (!tcpConnection) return;
  
  try {
    const buffer = new Uint8Array(1024);
    
    while (isConnected && tcpConnection) {
      const bytesRead = await tcpConnection.read(buffer);
      
      if (bytesRead === null) {
        // Connexion fermée
        isConnected = false;
        break;
      }
      
      // Convertir les données reçues en string
      const data = new TextDecoder().decode(buffer.subarray(0, bytesRead));
      
      // Parser les données (adapter selon le format de votre carte)
      // Exemple: "sensor1:1234,sensor2:2345,sensor3:3456"
      try {
        const values = parseHardwareData(data);
        if (values) {
          const now = new Date();
          sensorData = {
            sensor1: values.sensor1,
            sensor2: values.sensor2,
            sensor3: values.sensor3,
            timestamp: now.getTime(),
            time: now.toLocaleTimeString()
          };
        }
      } catch (parseError) {
        console.error('Erreur parsing données:', parseError);
      }
    }
  } catch (error) {
    console.error('Erreur lecture hardware:', error);
    isConnected = false;
    disconnectFromHardware();
  }
}

function parseHardwareData(data: string): { sensor1: number, sensor2: number, sensor3: number } | null {
  try {
    // Adapter ce parsing selon le format exact de votre carte
    // Exemple pour format "sensor1:1234,sensor2:2345,sensor3:3456"
    const parts = data.trim().split(',');
    const values: any = {};
    
    for (const part of parts) {
      const [key, value] = part.split(':');
      if (key && value) {
        values[key.trim()] = parseInt(value.trim());
      }
    }
    
    if (values.sensor1 !== undefined && values.sensor2 !== undefined && values.sensor3 !== undefined) {
      return {
        sensor1: values.sensor1,
        sensor2: values.sensor2,
        sensor3: values.sensor3
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erreur parsing:', error);
    return null;
  }
}

function disconnectFromHardware() {
  if (tcpConnection) {
    tcpConnection.close();
    tcpConnection = null;
  }
  isConnected = false;
  sensorData = null;
}

serve(async (req) => {
  // Gérer CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    
    if (url.pathname === '/connect') {
      // Endpoint pour initier la connexion
      const success = await connectToHardware();
      return Response.json(
        { connected: success, message: success ? 'Connexion établie' : 'Échec de connexion' },
        { headers: corsHeaders }
      );
    }
    
    if (url.pathname === '/disconnect') {
      // Endpoint pour fermer la connexion
      disconnectFromHardware();
      return Response.json(
        { connected: false, message: 'Connexion fermée' },
        { headers: corsHeaders }
      );
    }
    
    if (url.pathname === '/status') {
      // Endpoint pour vérifier le statut de connexion
      return Response.json(
        { 
          connected: isConnected,
          hasData: sensorData !== null,
          lastUpdate: sensorData?.timestamp || null
        },
        { headers: corsHeaders }
      );
    }
    
    if (url.pathname === '/data') {
      // Endpoint pour récupérer les données actuelles
      return Response.json(
        { 
          connected: isConnected,
          data: sensorData
        },
        { headers: corsHeaders }
      );
    }
    
    return Response.json(
      { error: 'Endpoint non trouvé' },
      { status: 404, headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('Erreur:', error);
    return Response.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
})