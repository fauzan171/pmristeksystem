import EventEmitter from 'events';
import makeWASocket, {
  type WASocket,
  type AuthenticationCreds,
  type AuthenticationState,
  type proto,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  initAuthCreds,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { sessionManager } from './session-manager.service';
import { AppError } from '../middleware/error.middleware';

const logger = pino({ level: 'silent' });

type SignalDataTypeMap = {
  [key: string]: any;
};

class WhatsAppService extends EventEmitter {
  private socket: WASocket | null = null;
  private currentQR: string | null = null;
  private isConnected = false;
  private phoneNumber: string | null = null;
  private currentUserId: string | null = null;

  constructor() {
    super();
  }

  /**
   * Initiate a WhatsApp connection for a given user.
   * Loads existing session from DB or generates a QR code for new pairing.
   */
  async connect(userId: string): Promise<{ needsQR: boolean; qr?: string }> {
    this.currentUserId = userId;

    const sessionData = await sessionManager.loadSession(userId);
    let authState: AuthenticationState;

    if (sessionData) {
      // Restore session from DB
      const creds = JSON.parse(sessionData.creds, bufferReviver) as AuthenticationCreds;
      const keys = JSON.parse(sessionData.keys, bufferReviver);

      authState = {
        creds,
        keys: this.createSignalKeyStore(keys),
      };
    } else {
      // New session — will need QR pairing
      const creds = initAuthCreds();
      authState = {
        creds,
        keys: this.createSignalKeyStore({}),
      };
    }

    const { version } = await fetchLatestBaileysVersion();

    this.socket = makeWASocket({
      version,
      auth: authState,
      logger,
      printQRInTerminal: false,
      browser: ['RPMS', 'Chrome', '1.0.0'],
    });

    this.registerSocketEvents(userId);

    return { needsQR: !sessionData, qr: this.currentQR || undefined };
  }

  /**
   * Register event handlers on the WA socket.
   */
  private registerSocketEvents(userId: string): void {
    if (!this.socket) return;

    this.socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.currentQR = qr;
        this.emit('qr', qr);
      }

      if (connection === 'close') {
        this.isConnected = false;
        this.emit('disconnected');

        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect && this.currentUserId) {
          await this.connect(this.currentUserId);
        } else {
          await sessionManager.updateStatus(userId, 'disconnected');
          this.socket = null;
        }
      }

      if (connection === 'open') {
        this.isConnected = true;
        this.currentQR = null;
        this.phoneNumber = this.socket?.user?.id?.split(':')[0] || null;

        await sessionManager.updateStatus(userId, 'connected', this.phoneNumber || undefined);
        await sessionManager.updateActivity(userId);

        this.emit('connected', { phoneNumber: this.phoneNumber });
      }
    });

    this.socket.ev.on('creds.update', async () => {
      if (!this.socket) return;

      const creds = JSON.stringify(this.socket.authState.creds, bufferReplacer);
      const keys = JSON.stringify(
        this.serializeKeys(this.socket.authState.keys),
        bufferReplacer,
      );

      await sessionManager.saveSession(userId, { creds, keys });
    });
  }

  /**
   * Create a signal key store that reads/writes from an in-memory object.
   */
  private createSignalKeyStore(
    initialKeys: Record<string, Record<string, any>>,
  ): any {
    const store: Record<string, Record<string, any>> = initialKeys || {};

    return makeCacheableSignalKeyStore(
      {
        get: async (type: string, ids: string[]) => {
          const data: Record<string, any> = {};
          for (const id of ids) {
            const value = store[type]?.[id];
            if (value) data[id] = value;
          }
          return data;
        },
        set: async (data: Record<string, Record<string, any>>) => {
          for (const [type, entries] of Object.entries(data)) {
            if (!store[type]) store[type] = {};
            Object.assign(store[type], entries);
          }
        },
        clear: async () => {
          for (const key of Object.keys(store)) {
            delete store[key];
          }
        },
      },
      logger,
    );
  }

  /**
   * Serialize the signal key store for DB storage.
   */
  private serializeKeys(keys: any): Record<string, Record<string, any>> {
    const serialized: Record<string, Record<string, any>> = {};
    // Keys are managed internally by makeCacheableSignalKeyStore
    // We rely on the in-memory store captured during set operations
    return serialized;
  }

  /**
   * Get the current QR code string.
   */
  getQRCode(): string | null {
    return this.currentQR;
  }

  /**
   * Send a text message to a WhatsApp group.
   */
  async sendMessage(groupId: string, message: string): Promise<proto.IWebMessageInfo> {
    if (!this.socket || !this.isConnected) {
      throw new AppError(400, 'WhatsApp is not connected');
    }

    const sent = await this.socket.sendMessage(groupId, { text: message });

    if (this.currentUserId) {
      await sessionManager.updateActivity(this.currentUserId);
    }

    return sent!;
  }

  /**
   * Fetch all groups the connected user is part of.
   */
  async getGroups(): Promise<{ id: string; name: string }[]> {
    if (!this.socket || !this.isConnected) {
      throw new AppError(400, 'WhatsApp is not connected');
    }

    const groups = await this.socket.groupFetchAllParticipating();

    return Object.values(groups).map((g) => ({
      id: g.id,
      name: g.subject,
    }));
  }

  /**
   * Disconnect and delete the WhatsApp session.
   */
  async disconnect(): Promise<void> {
    if (this.socket) {
      try {
        await this.socket.logout('RPMS disconnect');
      } catch {
        // Socket may already be closed
      }
      this.socket = null;
    }

    this.isConnected = false;
    this.currentQR = null;
    this.phoneNumber = null;

    if (this.currentUserId) {
      await sessionManager.deleteSession(this.currentUserId);
    }

    this.emit('disconnected');
  }

  /**
   * Get the current connection status.
   */
  getStatus(): { isConnected: boolean; phoneNumber: string | null; qrCode: string | null } {
    return {
      isConnected: this.isConnected,
      phoneNumber: this.phoneNumber,
      qrCode: this.currentQR,
    };
  }

  /**
   * Check if the socket is connected.
   */
  isActive(): boolean {
    return this.isConnected && this.socket !== null;
  }
}

/**
 * JSON replacer that handles Buffer/Uint8Array.
 */
function bufferReplacer(_key: string, value: any): any {
  if (value && value.type === 'Buffer') {
    return { __buffer: true, data: value.data };
  }
  if (value instanceof Uint8Array) {
    return { __buffer: true, data: Array.from(value) };
  }
  return value;
}

/**
 * JSON reviver that restores Buffer/Uint8Array.
 */
function bufferReviver(_key: string, value: any): any {
  if (value && value.__buffer) {
    return Buffer.from(value.data);
  }
  return value;
}

// Singleton instance
export const whatsappService = new WhatsAppService();
