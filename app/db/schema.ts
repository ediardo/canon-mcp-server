
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("camera", {
  id: int().primaryKey({ autoIncrement: true }),
  manufacturer: text().notNull(),
  modelName: text().notNull(),
  serialNumber: text().notNull(),
  firmwareVersion: text().notNull(),
  macAddress: text().notNull(),
  ipAddress: text().notNull(),
  port: int().notNull(),
  https: int().notNull(),
  username: text().notNull(),
  password: text().notNull(),
});


export const imagesTable = sqliteTable("images", {
  id: int().primaryKey({ autoIncrement: true }),
  cameraId: int().notNull(),
  imageUrl: text().notNull(),
  createdAt: text().notNull(),
});
