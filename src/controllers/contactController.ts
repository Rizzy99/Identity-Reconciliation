import { Request, Response } from "express";
import { findContact, createContact, updateContact, Contact } from "../models/contactModel";

export async function identifyCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      res.status(400).json({ error: "Email or phoneNumber is required" });
      return;
    }

    // Fetch all matching contacts
    const existingContacts: Contact[] = await findContact(email, phoneNumber);

    if (existingContacts.length === 0) {
      // No matching contacts, create a new primary contact
      const newContact = await createContact({
        email,
        phoneNumber,
        linkPrecedence: "primary",
      });
      res.status(200).json({
        contact: {
          primaryContactId: newContact.id,
          emails: [newContact.email],
          phoneNumbers: [newContact.phoneNumber],
          secondaryContactIds: [],
        },
      });
      return;
    }

    // Identify the primary contact (earliest createdAt)
    let primaryContact = existingContacts.reduce((primary, contact) => {
      const primaryCreatedAt = primary.createdAt ?? new Date(0); // Fallback to epoch
      const contactCreatedAt = contact.createdAt ?? new Date(0);
      return contactCreatedAt < primaryCreatedAt ? contact : primary;
    });

    // Update all other contacts to secondary
    for (const contact of existingContacts) {
      if (contact.id !== primaryContact.id) {
        await updateContact(contact.id!, primaryContact.id!);
      }
    }

    // Consolidate emails, phoneNumbers, and secondaryContactIds
    const emails = [
      ...new Set(existingContacts.map((c) => c.email).filter(Boolean)),
    ];
    const phoneNumbers = [
      ...new Set(existingContacts.map((c) => c.phoneNumber).filter(Boolean)),
    ];
    const secondaryContactIds = existingContacts
      .filter((c) => c.id !== primaryContact.id)
      .map((c) => c.id!);

    res.status(200).json({
      contact: {
        primaryContactId: primaryContact.id!,
        emails,
        phoneNumbers,
        secondaryContactIds,
      },
    });
  } catch (error) {
    console.error("Error identifying customer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

