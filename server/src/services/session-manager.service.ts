import prisma from '../config/database';

export interface SessionData {
  creds: string;
  keys: string;
}

class SessionManager {
  /**
   * Save or update a WhatsApp session for a user.
   */
  async saveSession(userId: string, sessionData: SessionData): Promise<void> {
    const data = JSON.stringify(sessionData);

    await prisma.whatsappSession.upsert({
      where: { userId },
      update: {
        sessionData: data,
        lastActivity: new Date(),
      },
      create: {
        userId,
        sessionData: data,
        status: 'disconnected',
        lastActivity: new Date(),
      },
    });
  }

  /**
   * Load a WhatsApp session for a user from the database.
   */
  async loadSession(userId: string): Promise<SessionData | null> {
    const session = await prisma.whatsappSession.findUnique({
      where: { userId },
    });

    if (!session) return null;

    try {
      return JSON.parse(session.sessionData) as SessionData;
    } catch {
      return null;
    }
  }

  /**
   * Delete a WhatsApp session for a user.
   */
  async deleteSession(userId: string): Promise<void> {
    await prisma.whatsappSession.deleteMany({
      where: { userId },
    });
  }

  /**
   * Update the last activity timestamp for a session.
   */
  async updateActivity(userId: string): Promise<void> {
    await prisma.whatsappSession.updateMany({
      where: { userId },
      data: { lastActivity: new Date() },
    });
  }

  /**
   * Update session status.
   */
  async updateStatus(
    userId: string,
    status: 'connected' | 'disconnected' | 'expired',
    phoneNumber?: string,
  ): Promise<void> {
    const data: any = { status };
    if (status === 'connected') {
      data.connectedAt = new Date();
      if (phoneNumber) data.phoneNumber = phoneNumber;
    }
    await prisma.whatsappSession.updateMany({
      where: { userId },
      data,
    });
  }

  /**
   * Get session record with metadata.
   */
  async getSessionRecord(userId: string) {
    return prisma.whatsappSession.findUnique({
      where: { userId },
    });
  }

  /**
   * Get all active sessions (for health checks).
   */
  async getActiveSessions() {
    return prisma.whatsappSession.findMany({
      where: { status: 'connected' },
    });
  }
}

export const sessionManager = new SessionManager();
