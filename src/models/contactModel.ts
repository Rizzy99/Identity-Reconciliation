import pool from "../config/db";

export interface Contact {
  id?: number;
  phoneNumber?: string;
  email?: string;
  linkedId?: number;
  linkPrecedence: "primary" | "secondary";
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export async function findContact(email?: string, phoneNumber?: string) {
  const query = "SELECT * FROM Contact WHERE deletedAt IS NULL AND (email = $1 OR phoneNumber = $2)";
  const { rows } = await pool.query(query, [email, phoneNumber]);
  return rows;
}

export async function createContact(contact: Contact) {
  const query = `
    INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence)
    VALUES ($1, $2, $3, $4) RETURNING *`;
  const values = [contact.phoneNumber, contact.email, contact.linkPrecedence, contact.linkedId];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function updateContact(id: number, linkedId: number) {
  const query = "UPDATE Contact SET linkedId = $1, linkPrecedence = 'secondary' WHERE id = $2 RETURNING *";
  const { rows } = await pool.query(query, [linkedId, id]);
  return rows[0];
}

