import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
export { firebaseConfig };
import { handleFirestoreError } from './firestoreErrorHandler';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Extraindo o ID do banco de dados com segurança
const config = firebaseConfig as Record<string, any>;
const databaseId = config.firestoreDatabaseId;

console.log("Inicializando Firestore com Database ID:", databaseId);

// Inicializa o Firestore com long polling para maior estabilidade em redes restritas
export const db: Firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test_connection', 'ping'));
    console.log("Conectado ao Firestore com sucesso!");
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, 'get', 'test_connection/ping');
    }

    if (error?.code === 'not-found' || error?.message?.includes('not found')) {
      console.error("ERRO CRÍTICO: O Banco de Dados Firestore ainda não foi criado ou o ID está incorreto.");
      console.error("Por favor, verifique no Console do Firebase se o banco com ID '" + (firebaseConfig as any).firestoreDatabaseId + "' existe.");
    } else if (error?.message?.includes('offline')) {
      console.warn("Firebase parece estar offline ou a configuração está incorreta.");
    } else {
      console.error("Erro ao testar conexão com Firestore:", error);
    }
  }
}

testConnection();
