/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `whatsapp_sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_sessions_user_id_key" ON "whatsapp_sessions"("user_id");
